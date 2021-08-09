import { Bullet } from '@/bullet/Bullet';
import { BulletPower } from '@/bullet/BulletPower';
import { BulletService } from '@/bullet/BulletService';
import { Color } from '@/drawable/Color';
import { ExplosionOptions } from '@/explosion/Explosion';
import { ExplosionType } from '@/explosion/ExplosionType';
import { SameTeamBulletHitMode } from '@/game-mode/IGameModeProperties';
import { GameObjectFactory } from '@/object/GameObjectFactory';
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
import { GameObject, GameObjectOptions, PartialGameObjectOptions } from '../object/GameObject';
import { GameObjectService, GameObjectServiceEvent } from '../object/GameObjectService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { rules } from '../physics/collisions/CollisionRules';
import { CollisionService, CollisionServiceEvent } from '../physics/collisions/CollisionService';
import { CollisionEvent } from '../physics/collisions/ICollisionRule';
import { Point } from '../physics/point/Point';
import { Player, PartialPlayerOptions, PlayerSpawnStatus } from '../player/Player';
import { PlayerService, PlayerServiceEvent } from '../player/PlayerService';
import { BroadcastBatchGameEvent, CommonBatchGameEvent, GameEntityComponentEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import { GameEventBatcher, GameEventBatcherEvent } from './GameEventBatcher';
import { GameModeService } from '@/game-mode/GameModeService';
import { Registry, RegistryComponentEvent } from '@/ecs/Registry';
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
import { Component, ComponentFlags, ComponentsInitialization } from '@/ecs/Component';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';
import { BoundingBoxComponent } from '@/physics/bounding-box/BoundingBoxComponent';

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
    private gameObjectRepository;
    private movingGameObjectRepository;
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
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.movingGameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>(this.config);
        this.collisionRules = rules;
        this.collisionService = new CollisionService(this.gameObjectRepository,
            this.boundingBoxRepository, this.registry, this.collisionRules);
        this.gameObjectService = new GameObjectService(
            this.gameObjectRepository,
            this.registry,
            this.movingGameObjectRepository,
        );
        this.tankService = new TankService(this.gameObjectRepository, this.gameObjectFactory);
        this.flagService = new FlagService(this.gameObjectRepository, this.gameObjectFactory, this.config);
        this.bulletService = new BulletService(this.gameObjectRepository, this.gameObjectFactory);
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
        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_ADDED,
            (component, data) => {
                this.onRegistryComponentEvent(
                    GameEvent.ENTITY_COMPONENT_ADDED,
                    component,
                    data,
                );
            });
        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_UPDATED,
            (component, data) => {
                this.onRegistryComponentEvent(
                    GameEvent.ENTITY_COMPONENT_UPDATED,
                    component,
                    data,
                );
            });
        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_BEFORE_REMOVE,
            (component) => {
                this.onRegistryComponentEvent(
                    GameEvent.ENTITY_COMPONENT_REMOVED,
                    component,
                );
            });
        this.registry.componentEmitter(PositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyBoundingBox(entity);
                    this.gameObjectService.markDirtyCenterPosition(entity);
                });
        this.registry.componentEmitter(SizeComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyBoundingBox(entity);
                    this.gameObjectService.markDirtyCenterPosition(entity);
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
                    const tank = this.tankService.createTankForPlayer(player, position, tankColor);
                    this.gameObjectService.registerObject(tank);
                } else if (status === PlayerSpawnStatus.DESPAWN && player.tankId !== null) {
                    this.gameObjectService.unregisterObject(player.tankId);
                }
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_DROP_FLAG,
            (playerId: string) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                const tank = this.tankService.getTank(player.tankId);
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
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REGISTERED,
            (object: GameObject) => {
                this.registry.registerEntity(object);

                this.gameEventBatcher.addBroadcastEvent([
                    GameEvent.OBJECT_REGISTERED,
                    object.toOptions(),
                    object.getComponentsData({
                        withoutFlags: ComponentFlags.LOCAL_ONLY,
                    }),
                ]);

                switch (object.type) {
                    case GameObjectType.TANK: {
                        const tank = object as Tank;
                        this.playerService.setPlayerTankId(tank.playerId, tank.id);
                        break;
                    }
                    case GameObjectType.BULLET: {
                        const bullet = object as Bullet;
                        this.tankService.addTankBullet(bullet.tankId, bullet.id);
                        break;
                    }
                }
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_UNREGISTERED,
            (objectId: number) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_UNREGISTERED, objectId]);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_CHANGED,
            (objectId: number, objectOptions: PartialGameObjectOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_CHANGED, objectId, objectOptions]);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BEFORE_UNREGISTER,
            (objectId: number) => {
                const object = this.gameObjectService.getObject(objectId);
                switch (object.type) {
                    case GameObjectType.TANK: {
                        const tank = object as Tank;
                        this.handleFlagInteraction(tank, undefined, FlagTankInteraction.DROP);
                        this.playerService.setPlayerTankId(tank.playerId, null);
                        break;
                    }
                    case GameObjectType.BULLET: {
                        const bullet = object as Bullet;
                        const tank = this.tankService.findTank(bullet.tankId);
                        if (tank === undefined) {
                            break;
                        }

                        this.tankService.removeTankBullet(bullet.tankId, objectId);
                        break;
                    }
                }

                this.registry.destroyEntity(object);
            });

        /**
         * TankService event handlers
         */
        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN,
            (tankId: number) => {
                const tank = this.tankService.getTank(tankId);
                const bullet = this.bulletService.createBulletForTank(tank);
                this.gameObjectService.registerObject(bullet);
            });

        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN,
            (tankId: number) => {
                const tank = this.tankService.getTank(tankId);
                const position = tank.getComponent(CenterPositionComponent);
                const smoke = this.gameObjectFactory.buildFromOptions({
                    type: GameObjectType.SMOKE,
                }, {
                    PositionComponent: position,
                });
                this.gameObjectService.registerObject(smoke);
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
        const spawnExplosion = (source: GameObject, type: string, destroyedObjectType?: string) => {
            const position = source.getComponent(CenterPositionComponent);
            const explosion = this.gameObjectFactory.buildFromOptions({
                type: GameObjectType.EXPLOSION,
                explosionType: type,
                destroyedObjectType,
            } as ExplosionOptions, {
                PositionComponent: position,
            });
            this.gameObjectService.registerObject(explosion);
        };

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_TRACKED_COLLISIONS,
            (objectId: number, tracker: CollisionTracker) => {
                const object = this.gameObjectService.getObject(objectId);

                switch (object.type) {
                    case GameObjectType.TANK:
                        this.tankService.updateTankCollisions(objectId, tracker);
                        break;
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            (bulletId: number, _staticObjectId: number, _position: Point) => {
                const bullet = this.gameObjectService.getObject(bulletId);
                spawnExplosion(bullet, ExplosionType.SMALL, GameObjectType.NONE);
                this.gameObjectService.markDestroyed(bullet);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            (bulletId: number, steelWallId: number, _position: Point) => {
                const bullet = this.bulletService.getBullet(bulletId);
                const steelWall = this.gameObjectService.getObject(steelWallId);
                this.gameObjectService.markDestroyed(bullet);
                if (bullet.power === BulletPower.HEAVY) {
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
                const objects = this.gameObjectService.getMultipleObjects(objectsIds);
                const bullet = this.gameObjectService.getObject(bulletId);
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
                const bullet = this.bulletService.getBullet(bulletId);
                if (bullet.tankId === tankId) {
                    return;
                }

                const tank = this.tankService.getTank(tankId);
                const gameModeProperties = this.gameModeService.getGameModeProperties();

                let ignoreBulletDamage = false;
                let destroyBullet = false;
                if (SameTeamBulletHitMode.DESTROY === gameModeProperties.sameTeamBulletHitMode
                    || SameTeamBulletHitMode.PASS === gameModeProperties.sameTeamBulletHitMode) {
                    const tankPlayer = this.playerService.getPlayer(tank.playerId);

                    let bulletPlayer;
                    if (bullet.playerId !== undefined) {
                        bulletPlayer = this.playerService.getPlayer(bullet.playerId);
                    }

                    if (bulletPlayer !== undefined && bulletPlayer.teamId === tankPlayer.teamId) {
                        ignoreBulletDamage = true;

                        if (gameModeProperties.sameTeamBulletHitMode === SameTeamBulletHitMode.DESTROY) {
                            destroyBullet = true;
                        }
                    }
                }

                if (!ignoreBulletDamage) {
                    const tankHealth = tank.health;
                    const bulletDamage = bullet.damage;

                    this.tankService.decreaseTankHealth(tankId, bulletDamage);
                    bullet.damage -= tankHealth;
                }

                if (tank.health <= 0) {
                    spawnExplosion(tank, ExplosionType.BIG, GameObjectType.TANK);
                    this.playerService.setPlayerRequestedSpawnStatus(tank.playerId, PlayerSpawnStatus.DESPAWN);
                    this.playerService.addPlayerDeath(tank.playerId);
                    if (bullet.playerId !== undefined) {
                        this.playerService.addPlayerKill(bullet.playerId);
                    }
                } else {
                    spawnExplosion(bullet, ExplosionType.SMALL, GameObjectType.NONE);
                }

                if (destroyBullet || bullet.damage <= 0) {
                    spawnExplosion(bullet, ExplosionType.SMALL);
                    this.gameObjectService.markDestroyed(bullet);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            (movingBulletId: number, staticBulletId: number, _position: Point) => {
                const movingBullet = this.bulletService.getBullet(movingBulletId);
                const staticBullet = this.bulletService.getBullet(staticBulletId);
                if (movingBullet.tankId === staticBullet.tankId) {
                    return;
                }

                spawnExplosion(movingBullet, ExplosionType.SMALL);
                this.gameObjectService.markDestroyed(movingBullet);
                this.gameObjectService.markDestroyed(staticBullet);
            });

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG,
            (tankId: number, flagId: number) => {
                const tank = this.tankService.getTank(tankId);
                const flag = this.flagService.getFlag(flagId);
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
                this.collisionService.processObjectsDestroyedBoundingBox();
                this.gameObjectService.processObjectsDestroyed();
                this.gameObjectService.processObjectsDirection();
                this.collisionService.processObjectsRequestedDirection();
                this.gameObjectService.processObjectsPosition(deltaSeconds);
                this.collisionService.processObjectsRequestedPosition();
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
    >(event: GameEntityComponentEvent, component: C, data?: any): void {
        if (component.flags & ComponentFlags.LOCAL_ONLY) {
            return;
        }

        if (data === undefined
            || event === GameEvent.ENTITY_COMPONENT_REMOVED) {
            this.gameEventBatcher.addBroadcastEvent([
                event,
                component.entity.id,
                component.clazz.tag,
            ]);
        } else {
            this.gameEventBatcher.addBroadcastEvent([
                event,
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
            case FlagTankInteraction.STEAL:
                assert(flag !== undefined);
                this.tankService.setTankFlag(tank.id, flag.teamId, flag.color, flag.id);
                this.flagService.setFlagType(flag.id, FlagType.BASE_ONLY);
                break;
            case FlagTankInteraction.PICK:
                assert(flag !== undefined);
                this.tankService.setTankFlag(tank.id, flag.teamId, flag.color, flag.sourceId);
                this.gameObjectService.markDestroyed(flag);
                break;
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
                    this.gameObjectService.registerObject(flag);
                }
                break;
            default:
                break;
        }
    }

    sendRequestedServerStatus(playerId?: string): void {
        const objects = this.gameObjectService.getObjects();
        const objectsOptions =
            LazyIterable.from(objects)
                .map(object => {
                    return [
                        object.toOptions(),
                        object.getComponentsData({
                            withoutFlags: ComponentFlags.LOCAL_ONLY,
                        }),
                    ];
                })
                .toArray() as Iterable<[GameObjectOptions, ComponentsInitialization]>;

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
        const objects = objectsOptions
            .filter(o => this.gameModeService.isIgnoredObjectType(o[0].type))
            .map(o => this.gameObjectFactory.buildFromOptions(o[0], o[1]));
        this.gameObjectService.registerObjects(objects);

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

        this.gameObjectService.unregisterAll();
        this.playerService.resetFields();

        const gameMap = this.gameMapService.getLoadedMap();
        if (gameMap === undefined) {
            throw new Error('Cannot reload game without a loaded map');
        }
        this.loadMap(gameMap);

        this.ticker.start();
        this.timeService.restartRoundTime();
    }
}
