import { BulletPower } from '@/bullet/BulletPower';
import { BulletService } from '@/bullet/BulletService';
import { Color } from '@/drawable/Color';
import { ExplosionOptions } from '@/explosion/Explosion';
import { ExplosionType } from '@/explosion/ExplosionType';
import { SameTeamBulletHitMode } from '@/game-mode/IGameModeProperties';
import { GameObjectFactory, GameObjectFactoryBuildOptions } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { CollisionTracker } from '@/physics/collisions/CollisionTracker';
import { Direction } from '@/physics/Direction';
import { Tank, PartialTankOptions } from '@/tank/Tank';
import { TankService, TankServiceEvent } from '@/tank/TankService';
import { TankTier } from '@/tank/TankTier';
import { Team } from '@/team/Team';
import { TeamService, TeamServiceEvent } from '@/team/TeamService';
import { LazyIterable } from '@/utils/LazyIterable';
import { MapRepository } from '@/utils/MapRepository';
import { Ticker, TickerEvent } from '@/utils/Ticker';
import EventEmitter from 'eventemitter3';
import { Action, ActionType } from '../actions/Action';
import { ButtonPressAction } from '../actions/ButtonPressAction';
import { GameMapService } from '../maps/GameMapService';
import { GameObject, PartialGameObjectOptions } from '../object/GameObject';
import { GameObjectService, GameObjectServiceEvent } from '../object/GameObjectService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { rules } from '../physics/collisions/CollisionRules';
import { CollisionService, CollisionServiceEvent } from '../physics/collisions/CollisionService';
import { CollisionEvent } from '../physics/collisions/ICollisionRule';
import { Point } from '../physics/point/Point';
import { Player, PartialPlayerOptions, PlayerSpawnStatus } from '../player/Player';
import { PlayerService, PlayerServiceEvent } from '../player/PlayerService';
import { BroadcastBatchGameEvent, CommonBatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import { GameEventBatcher, GameEventBatcherEvent } from './GameEventBatcher';
import { GameModeService } from '@/game-mode/GameModeService';
import { Registry, RegistryComponentEvent, RegistryEvent } from '@/ecs/Registry';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { ComponentRegistry } from '@/ecs/ComponentRegistry';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { Flag, FlagType, PartialFlagOptions } from '@/flag/Flag';
import { FlagService, FlagServiceEvent, FlagTankInteraction } from '@/flag/FlagService';
import { PlayerPointsEvent } from '@/player/PlayerPoints';
import { Config } from '@/config/Config';
import { TimeService, TimeServiceEvent } from '@/time/TimeService';
import { GameMap } from '@/maps/GameMap';
import { assert } from '@/utils/assert';
import { Component, ComponentFlags } from '@/ecs/Component';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { Entity } from '@/ecs/Entity';
import { EntityOwnedComponent } from '@/components/EntityOwnedComponent';
import { BulletComponent } from '@/bullet/BulletComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { ColorComponent } from '@/components/ColorComponent';
import { BoundingBoxComponent } from '@/physics/bounding-box/BoundingBoxComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';

export enum GameServerEvent {
    PLAYER_BATCH = 'player-batch',
    BROADCAST_BATCH = 'broadcast-batch',
}

export interface GameServerEvents {
    [GameServerEvent.BROADCAST_BATCH]: (events: BroadcastBatchGameEvent[]) => void;
    [GameServerEvent.PLAYER_BATCH]: (playerId: string, events: UnicastBatchGameEvent[]) => void;
}

export class GameServer {
    private registryIdGenerator;
    private componentRegistry;
    private registry;
    private entityBlueprint;

    private config;
    private gameModeService;
    private gameObjectFactory;
    private gameMapService;
    private playerRepository;
    private playerService;
    private gameObjectService;
    private tankService;
    private flagService;
    private bulletService;
    private boundingBoxRepository;
    private collisionRules;
    private collisionService;
    private gameEventBatcher;
    private teamRepository;
    private teamService;
    private timeService;
    ticker;

    emitter = new EventEmitter<GameServerEvents>();

    constructor(mapName: string, gameMode: string) {
        this.config = new Config();
        this.config.loadAll('./configs');

        this.registryIdGenerator = new RegistryNumberIdGenerator();
        this.componentRegistry = new ComponentRegistry();
        this.registry = new Registry(this.registryIdGenerator, this.componentRegistry);
        this.entityBlueprint = new EntityBlueprint(this.config, BlueprintEnv.SERVER);
        this.entityBlueprint.reloadBlueprintData();

        this.gameObjectFactory = new GameObjectFactory(this.registry, this.config, this.entityBlueprint);

        this.gameModeService = new GameModeService(this.config);
        this.boundingBoxRepository = new BoundingBoxRepository<number>(this.config);
        this.collisionRules = rules;
        this.collisionService = new CollisionService(
            this.boundingBoxRepository,
            this.registry,
            this.collisionRules,
        );
        this.gameObjectService = new GameObjectService(this.registry);
        this.tankService = new TankService(this.gameObjectFactory, this.registry);
        this.flagService = new FlagService(this.gameObjectFactory, this.registry, this.config);
        this.bulletService = new BulletService(this.gameObjectFactory, this.registry);
        this.gameMapService = new GameMapService(this.config, this.entityBlueprint);
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.config, this.playerRepository);
        this.teamRepository = new MapRepository<string, Team>();
        this.teamService = new TeamService(this.teamRepository);
        this.timeService = new TimeService(this.config);
        this.gameEventBatcher = new GameEventBatcher();

        const ticksPerSecond = this.config.get<number>('game-server', 'ticksPerSecond');
        this.ticker = new Ticker(ticksPerSecond);

        /**
         * Registry event handlers
         */
        this.registry.emitter.on(RegistryEvent.ENTITY_REGISTERED,
            (entity: Entity) => {
                const object = entity as GameObject;
                this.gameEventBatcher.addBroadcastEvent([
                    GameEvent.OBJECT_REGISTERED,
                    {
                        type: object.type,
                        subtypes: object.subtypes,
                        options: object.toOptions(),
                        components: object.getComponentsData({
                            withoutFlags: ComponentFlags.LOCAL_ONLY,
                        }),
                    },
                ]);

                switch (object.type) {
                    case GameObjectType.TANK: {
                        const tank = object as Tank;
                        this.playerService.setPlayerTankId(tank.playerId, tank.id);
                        break;
                    }
                    case GameObjectType.BULLET: {
                        const bulletOwnerEntityId =
                            object.getComponent(EntityOwnedComponent).entityId;
                        this.tankService.addTankBullet(bulletOwnerEntityId,
                            object.id);
                        break;
                    }
                }
            });
        this.registry.emitter.on(RegistryEvent.ENTITY_BEFORE_DESTROY,
            (entity: Entity) => {
                const object = entity as GameObject;

                switch (object.type) {
                    case GameObjectType.TANK: {
                        const tank = object as Tank;
                        this.handleFlagInteraction(tank, undefined, FlagTankInteraction.DROP);
                        this.playerService.setPlayerTankId(tank.playerId, null);
                        break;
                    }
                    case GameObjectType.BULLET: {
                        const bulletOwnerEntityId =
                            object.getComponent(EntityOwnedComponent).entityId;
                        this.tankService.removeTankBullet(bulletOwnerEntityId,
                            entity.id);
                        break;
                    }
                }

                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_UNREGISTERED, entity.id]);
            });

        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_CHANGED,
            (event, component, data) => {
                this.onRegistryComponentEvent(
                    event,
                    component,
                    data,
                );
            });
        this.registry.componentEmitter(PositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyBoundingBox(entity);
                    this.gameObjectService.markDirtyCenterPosition(entity);
                });
        this.registry.componentEmitter(SizeComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyBoundingBox(entity);
                    this.gameObjectService.markDirtyCenterPosition(entity);
                });
        this.registry.componentEmitter(BoundingBoxComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyCollisions(entity);
                });
        /**
         * PlayerService event handlers
         */
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SERVER_STATUS,
            (playerId: string) => {
                this.sendRequestedServerStatus(playerId);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_ADDED,
            (player: Player) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_ADDED, player.toOptions()]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_CHANGED,
            (playerId: string, playerOptions: PartialPlayerOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_CHANGED, playerId, playerOptions]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_BEFORE_REMOVE,
            (playerId: string) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.teamId === null) {
                    return;
                }

                this.teamService.removeTeamPlayer(player.teamId, playerId);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REMOVED,
            (playerId: string) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_REMOVED, playerId]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SHOOT,
            (playerId: string, isShooting: boolean) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                this.tankService.setTankShooting(player.tankId, isShooting);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_MOVE,
            (playerId: string, direction: Direction | undefined) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                if (direction === undefined) {
                    this.gameObjectService.setObjectMovementDirection(player.tankId, null);
                } else {
                    this.gameObjectService.setObjectMovementDirection(player.tankId, direction);
                }
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SPAWN_STATUS,
            (playerId: string, status: PlayerSpawnStatus) => {
                const player = this.playerService.getPlayer(playerId);

                if (status === PlayerSpawnStatus.SPAWN && player.tankId === null) {
                    const gameModeProperties = this.gameModeService.getGameModeProperties();
                    if (gameModeProperties.hasTeams && player.teamId === null) {
                        const team = this.teamService.getTeamWithLeastPlayers();
                        this.setPlayerTeam(playerId, team.id);
                    }

                    let tankColor;
                    if (gameModeProperties.hasTeams && player.teamId !== null) {
                        const team = this.teamService.getTeam(player.teamId);
                        tankColor = team.color;
                    } else {
                        tankColor = player.requestedTankColor;
                    }

                    const position = this.gameObjectService.getRandomSpawnPosition(player.teamId);
                    this.tankService.createTankForPlayer(player, position, tankColor);
                } else if (status === PlayerSpawnStatus.DESPAWN && player.tankId !== null) {
                    const tank = this.registry.getEntityById(player.tankId);
                    this.gameObjectService.markDestroyed(tank);
                }
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_DROP_FLAG,
            (playerId: string) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                const tank = this.registry.getEntityById(player.tankId) as Tank;
                this.handleFlagInteraction(tank, undefined, FlagTankInteraction.DROP);
            });

        /**
         * TeamService event handlers
         */
        this.teamService.emitter.on(TeamServiceEvent.TEAM_PLAYER_ADDED,
            (teamId: string, playerId: string) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.TEAM_PLAYER_ADDED, teamId, playerId]);
            });

        this.teamService.emitter.on(TeamServiceEvent.TEAM_PLAYER_REMOVED,
            (teamId: string, playerId: string) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.TEAM_PLAYER_REMOVED, teamId, playerId]);
            });

        /**
         * GameObjectService event handlers
         */
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_CHANGED,
            (objectId: number, objectOptions: PartialGameObjectOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_CHANGED, objectId, objectOptions]);
            });

        /**
         * TankService event handlers
         */
        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN,
            (tankId: number) => {
                const tank = this.registry.getEntityById(tankId) as Tank;
                this.bulletService.createBulletForTank(tank);
            });

        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN,
            (tankId: number) => {
                const tank = this.registry.getEntityById(tankId) as Tank;
                const position = tank.getComponent(CenterPositionComponent);
                this.gameObjectFactory.buildFromOptions({
                    type: GameObjectType.SMOKE,
                    components: {
                        PositionComponent: position,
                    },
                });
            });

        this.tankService.emitter.on(TankServiceEvent.TANK_UPDATED,
            (tankId: number, tankOptions: PartialTankOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_CHANGED, tankId, tankOptions]);
            });

        this.flagService.emitter.on(FlagServiceEvent.FLAG_UPDATED,
            (flagId: number, flagOptions: PartialFlagOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_CHANGED, flagId, flagOptions]);
            });

        /**
         * CollisionService event handlers
         */
        const spawnExplosion = (source: Entity, type: string, destroyedObjectType?: string) => {
            const position = source.getComponent(CenterPositionComponent);
            this.gameObjectFactory.buildFromOptions({
                type: GameObjectType.EXPLOSION,
                options: {
                    explosionType: type,
                    destroyedObjectType,
                } as ExplosionOptions,
                components: {
                    PositionComponent: position,
                },
            });
        };

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_TRACKED_COLLISIONS,
            (objectId: number, tracker: CollisionTracker) => {
                const object = this.registry.getEntityById(objectId);

                switch (object.type) {
                    case GameObjectType.TANK:
                        this.tankService.updateTankCollisions(objectId, tracker);
                        break;
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            (bulletId: number, _staticObjectId: number, _position: Point) => {
                const bullet = this.registry.getEntityById(bulletId);
                spawnExplosion(bullet, ExplosionType.SMALL, GameObjectType.NONE);
                this.gameObjectService.markDestroyed(bullet);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            (bulletId: number, steelWallId: number, _position: Point) => {
                const bullet = this.registry.getEntityById(bulletId);
                const steelWall = this.registry.getEntityById(steelWallId);
                this.gameObjectService.markDestroyed(bullet);
                const bulletPower = bullet.getComponent(BulletComponent).power;
                if (bulletPower === BulletPower.HEAVY) {
                    spawnExplosion(bullet, ExplosionType.SMALL);
                    this.gameObjectService.markDestroyed(steelWall);
                } else {
                    spawnExplosion(bullet, ExplosionType.SMALL, GameObjectType.NONE);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BRICK_WALL,
            (bulletId: number, brickWallId: number, _position: Point) => {
                const destroyBox = this.bulletService.getBulletBrickWallDestroyBox(bulletId, brickWallId);
                const objectsIds = this.collisionService.getOverlappingObjects(destroyBox);
                const objects = this.registry.getMultipleEntitiesById(objectsIds);
                const bullet = this.registry.getEntityById(bulletId);
                spawnExplosion(bullet, ExplosionType.SMALL);
                this.gameObjectService.markDestroyed(bullet);

                LazyIterable.from(objects)
                    .filter(o => o.type === GameObjectType.BRICK_WALL)
                    .forEach(brickWall => {
                        this.gameObjectService.markDestroyed(brickWall);
                    });
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_TANK,
            (bulletId: number, tankId: number, _position: Point) => {
                const bullet = this.registry.getEntityById(bulletId);

                const bulletOwnerEntityId =
                    bullet.getComponent(EntityOwnedComponent).entityId;
                if (bulletOwnerEntityId === tankId) {
                    return;
                }

                const tank = this.registry.getEntityById(tankId) as Tank;
                const bulletOwnerPlayerId =
                    bullet.getComponent(PlayerOwnedComponent).playerId;
                const tankPlayer = this.playerService.findPlayer(tank.playerId);
                const bulletPlayer = this.playerService.findPlayer(bulletOwnerPlayerId);
                const isSameTeamShot = tankPlayer?.teamId === bulletPlayer?.teamId;

                const gameModeProperties = this.gameModeService.getGameModeProperties();
                let destroyBullet = false;
                let ignoreBulletDamage = false;

                if (isSameTeamShot
                    && gameModeProperties.sameTeamBulletHitMode
                        === SameTeamBulletHitMode.DESTROY) {
                    destroyBullet = true;
                    ignoreBulletDamage = true;
                } else if (isSameTeamShot
                    && gameModeProperties.sameTeamBulletHitMode
                        === SameTeamBulletHitMode.PASS) {
                    ignoreBulletDamage = true;
                } else if (!isSameTeamShot ||
                    gameModeProperties.sameTeamBulletHitMode
                        === SameTeamBulletHitMode.ALLOW) {
                    destroyBullet = true;
                }

                const bulletComponent = bullet.getComponent(BulletComponent);
                let bulletDamage = bulletComponent.damage;
                if (!ignoreBulletDamage) {
                    const tankHealth = tank.health;

                    this.tankService.decreaseTankHealth(tankId, bulletDamage);
                    bulletDamage -= tankHealth;

                    bulletComponent.update({
                        damage: bulletDamage,
                    });
                }

                if (tank.health <= 0) {
                    spawnExplosion(tank, ExplosionType.BIG, GameObjectType.TANK);
                    this.playerService.setPlayerRequestedSpawnStatus(tank.playerId, PlayerSpawnStatus.DESPAWN);
                    this.playerService.addPlayerDeath(tank.playerId);
                    if (bulletPlayer !== undefined) {
                        this.playerService.addPlayerKill(bulletPlayer.id);
                    }
                } else {
                    spawnExplosion(bullet, ExplosionType.SMALL, GameObjectType.NONE);
                }

                if (destroyBullet || bulletDamage <= 0) {
                    spawnExplosion(bullet, ExplosionType.SMALL);
                    this.gameObjectService.markDestroyed(bullet);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            (movingBulletId: number, staticBulletId: number, _position: Point) => {
                const movingBullet = this.registry.getEntityById(movingBulletId);
                const staticBullet = this.registry.getEntityById(staticBulletId);
                const movingBulletOwnerEntityId =
                    staticBullet.getComponent(EntityOwnedComponent).entityId;
                const staticBulletOwnerEntityId =
                    staticBullet.getComponent(EntityOwnedComponent).entityId;
                if (movingBulletOwnerEntityId === staticBulletOwnerEntityId) {
                    return;
                }

                spawnExplosion(movingBullet, ExplosionType.SMALL);
                this.gameObjectService.markDestroyed(movingBullet);
                this.gameObjectService.markDestroyed(staticBullet);
            });

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG,
            (tankId: number, flagId: number) => {
                const tank = this.registry.getEntityById(tankId) as Tank;
                const flag = this.registry.getEntityById(flagId) as Flag;
                const interaction = this.flagService.getFlagTankInteractionType(flag, tank);
                if (interaction !== undefined) {
                    this.handleFlagInteraction(tank, flag, interaction);
                }
            });

        /*
         * Time Service event handlers
         */
        this.timeService.emitter.on(TimeServiceEvent.ROUND_TIME_UPDATED,
            (roundTime: number) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.ROUND_TIME_UPDATED, roundTime]);
            });
        this.timeService.emitter.on(TimeServiceEvent.SCOREBOARD_WATCH_TIME,
            (value: boolean) => {
                if (value) {
                    this.playerService.cancelPlayersActions();
                }
            });

        /**
         * Game Event Batcher event handlers
         */
        this.gameEventBatcher.emitter.on(GameEventBatcherEvent.BROADCAST_BATCH,
            (events: BroadcastBatchGameEvent[]) => {
                this.emitter.emit(GameServerEvent.BROADCAST_BATCH, events);
            });

        this.gameEventBatcher.emitter.on(GameEventBatcherEvent.PLAYER_BATCH,
            (playerId: string, events: UnicastBatchGameEvent[]) => {
                this.emitter.emit(GameServerEvent.PLAYER_BATCH, playerId, events);
            });

        /**
         * Ticker event handlers
         */
        this.ticker.emitter.on(TickerEvent.TICK,
            (deltaSeconds: number) => {
                this.playerService.processPlayersStatus(deltaSeconds);
                this.tankService.processTanksStatus();
                this.gameObjectService.processObjectsAutomaticDestroy();
                this.collisionService.processObjectsDestroyedWithCollisions();
                this.gameObjectService.processObjectsDestroyed();
                this.collisionService.processObjectsDirtyCollisions();
                this.gameObjectService.processObjectsDirection();
                this.collisionService.processObjectsRequestedDirection();
                this.gameObjectService.processObjectsPosition(deltaSeconds);
                this.collisionService.processObjectsRequestedPosition();
                this.gameObjectService.processObjectsDirtyIsMoving();
                this.gameObjectService.processObjectsDirtyCenterPosition();
                this.collisionService.processObjectsDirtyBoundingBox();
                this.timeService.decreaseRoundTime(deltaSeconds);
                if (this.timeService.isRoundEnded()) {
                    this.reload();
                }
                this.gameEventBatcher.flush();
            });

        this.gameModeService.setGameMode(gameMode);
        this.gameMapService.loadByName(mapName);
        this.reload();
    }

    onRegistryComponentEvent<
        C extends Component<C>,
    >(event: RegistryComponentEvent, component: C, data?: any): void {
        if (component.flags & ComponentFlags.LOCAL_ONLY) {
            return;
        }

        let gameEvent;
        switch (event) {
            case RegistryComponentEvent.COMPONENT_ADDED:
                gameEvent = GameEvent.ENTITY_COMPONENT_ADDED;
                break;
            case RegistryComponentEvent.COMPONENT_UPDATED:
                gameEvent = GameEvent.ENTITY_COMPONENT_UPDATED;
                break;
            case RegistryComponentEvent.COMPONENT_BEFORE_REMOVE:
                gameEvent = GameEvent.ENTITY_COMPONENT_REMOVED;
                break;
            default:
                assert(false);
        }

        if (gameEvent === GameEvent.ENTITY_COMPONENT_REMOVED) {
            this.gameEventBatcher.addBroadcastEvent([
                gameEvent,
                component.entity.id,
                component.clazz.tag,
            ]);
        } else if (gameEvent === GameEvent.ENTITY_COMPONENT_ADDED
            || gameEvent === GameEvent.ENTITY_COMPONENT_UPDATED) {
            this.gameEventBatcher.addBroadcastEvent([
                gameEvent,
                component.entity.id,
                component.clazz.tag,
                data,
            ]);
        }

    }

    handleFlagInteraction(
        tank: Tank,
        flag: Flag | undefined,
        interaction: FlagTankInteraction,
    ): void {
        switch (interaction) {
            case FlagTankInteraction.STEAL: {
                assert(flag !== undefined);
                const flagColor = flag.getComponent(ColorComponent).value;
                this.tankService.setTankFlag(tank.id, flag.teamId, flagColor, flag.id);
                this.flagService.setFlagType(flag.id, FlagType.BASE_ONLY);
                break;
            }
            case FlagTankInteraction.PICK: {
                assert(flag !== undefined);
                const flagColor = flag.getComponent(ColorComponent).value;
                this.tankService.setTankFlag(tank.id, flag.teamId, flagColor, flag.sourceId);
                this.gameObjectService.markDestroyed(flag);
                break;
            }
            case FlagTankInteraction.RETURN:
                assert(flag !== undefined);
                this.tankService.clearTankFlag(tank.id);
                this.flagService.setFlagType(flag.id, FlagType.FULL);
                this.playerService.addPlayerPoints(tank.playerId, PlayerPointsEvent.RETURN_FLAG);
                break;
            case FlagTankInteraction.CAPTURE:
                this.playerService.addPlayerPoints(tank.playerId, PlayerPointsEvent.CAPTURE_FLAG);
                if (tank.flagSourceId !== null) {
                    this.flagService.setFlagType(tank.flagSourceId, FlagType.FULL);
                }
                this.tankService.clearTankFlag(tank.id);
                break;
            case FlagTankInteraction.DROP:
                flag = this.flagService.createFlagForTank(tank);
                if (flag !== undefined) {
                    this.tankService.clearTankFlag(tank.id);
                }
                break;
            default:
                break;
        }
    }

    sendRequestedServerStatus(playerId?: string): void {
        const objects = this.registry.getEntities() as Iterable<GameObject>;
        const objectsOptions =
            LazyIterable.from(objects)
                .map(object => {
                    return {
                        type: object.type,
                        subtypes: object.subtypes,
                        options: object.toOptions(),
                        components: object.getComponentsData({
                            withoutFlags: ComponentFlags.LOCAL_ONLY,
                        }),
                    };
                })
                .toArray() as Iterable<GameObjectFactoryBuildOptions>;

        const players = this.playerService.getPlayers();
        const playersOptions =
            LazyIterable.from(players)
                .map(player => player.toOptions())
                .toArray();

        const teams = this.teamService.getTeams();
        let teamsOptions;
        if (teams !== undefined) {
            teamsOptions =
                LazyIterable.from(teams)
                    .map(team => team.toOptions())
                    .toArray();
        }

        const configsData = this.config.getDataMultiple([
            'bounding-box',
            'game-object-properties',
            'entities-blueprint',
            'game-client',
            'time',
        ]);

        const event: CommonBatchGameEvent = [GameEvent.SERVER_STATUS, {
            objectsOptions,
            playersOptions,
            teamsOptions,
            configsData,
        }];

        if (playerId === undefined) {
            this.gameEventBatcher.addBroadcastEvent(event);
        } else {
            this.gameEventBatcher.addPlayerEvent(playerId, event);
        }
    }

    onPlayerRequestedServerStatus(playerId: string): void {
        this.playerService.setPlayerRequestedServerStatus(playerId);
    }

    onPlayerAction(playerId: string, action: Action): void {
        if (this.timeService.isScoreboardWatchTime()) {
            return;
        }

        if (action.type === ActionType.BUTTON_PRESS) {
            this.playerService.addPlayerButtonPressAction(playerId, action as ButtonPressAction);
        }
    }

    onPlayerConnected(playerId: string): void {
        this.playerService.createPlayer(playerId);
        this.playerService.setPlayerRequestedServerStatus(playerId);
    }

    onPlayerSetName(playerId: string, name: string): void {
        this.playerService.setPlayerName(playerId, name);
    }

    onPlayerRequestSpawnStatus(playerId: string, spawnStatus: PlayerSpawnStatus): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, spawnStatus);
    }

    setPlayerTeam(playerId: string, teamId: string | null): void {
        const player = this.playerService.getPlayer(playerId);
        if (player.teamId !== null) {
            this.teamService.removeTeamPlayer(player.teamId, playerId);
        }

        if (teamId !== null) {
            this.teamService.addTeamPlayer(teamId, playerId);
        }

        this.playerService.setPlayerTeamId(playerId, teamId);
    }

    onPlayerRequestTeam(playerId: string, teamId: string | null): void {
        const gameModeProperties = this.gameModeService.getGameModeProperties();
        if (!gameModeProperties.hasTeams) {
            return;
        }

        if (teamId !== null) {
            const team = this.teamService.findTeamById(teamId);
            if (team === undefined) {
                return;
            }

            const player = this.playerService.getPlayer(playerId);
            let existingTeam;
            if (player.teamId !== null) {
                existingTeam = this.teamService.getTeam(player.teamId);
            } else {
                existingTeam = this.teamService.getTeamWithLeastPlayers();
            }

            if (!this.teamService.isTeamSwitchingAllowed(existingTeam.id, team.id)) {
                return;
            }
        }

        this.setPlayerTeam(playerId, teamId);
    }

    onPlayerDisconnected(playerId: string): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, PlayerSpawnStatus.DESPAWN);
        this.playerService.setPlayerRequestedDisconnect(playerId);
    }

    onPlayerRequestTankColor(playerId: string, color: Color): void {
        const gameModeProperties = this.gameModeService.getGameModeProperties();
        if (gameModeProperties.hasTeams) {
            return;
        }

        this.playerService.setPlayerRequestedTankColor(playerId, color);
    }

    onPlayerRequestTankTier(playerId: string, tier: TankTier): void {
        this.playerService.setPlayerRequestedTankTier(playerId, tier);
    }

    loadMap(gameMap: GameMap): void {
        const objectsOptions = gameMap.getObjectsOptions();
        objectsOptions
            .filter(o => this.gameModeService.isIgnoredObjectType(o.type))
            .forEach(o => this.gameObjectFactory.buildFromOptions(o));

        const teamsOptions = gameMap.getTeamsOptions();
        const gameModeProperties = this.gameModeService.getGameModeProperties();
        if (!gameModeProperties.hasTeams) {
            return;
        }

        const teams = teamsOptions.map(o => new Team(o));
        this.teamService.addTeams(teams);
    }

    reload(): void {
        this.ticker.stop();

        this.registry.destroyAllEntities();
        this.playerService.resetFields();

        const gameMap = this.gameMapService.getLoadedMap();
        assert(gameMap !== undefined, 'Cannot reload game without a loaded map');

        this.loadMap(gameMap);

        this.ticker.start();
        this.timeService.restartRoundTime();
    }
}
