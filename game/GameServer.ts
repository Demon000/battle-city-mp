import { BulletPower } from '@/bullet/BulletPower';
import { BulletService } from '@/bullet/BulletService';
import { Color } from '@/drawable/Color';
import { ExplosionType } from '@/explosion/ExplosionType';
import { SameTeamBulletHitMode } from '@/game-mode/IGameModeProperties';
import { EntityFactory, EntityBuildOptions } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { Direction } from '@/physics/Direction';
import { TankService } from '@/tank/TankService';
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
import { EntityService } from '../entity/EntityService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { rules } from '../physics/collisions/CollisionRules';
import { CollisionService } from '../physics/collisions/CollisionService';
import { CollisionEvent } from '../physics/collisions/ICollisionRule';
import { Point } from '../physics/point/Point';
import { Player, PartialPlayerOptions, PlayerSpawnStatus } from '../player/Player';
import { PlayerService, PlayerServiceEvent } from '../player/PlayerService';
import { BroadcastBatchGameEvent, CommonBatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import { GameEventBatcher, GameEventBatcherEvent } from './GameEventBatcher';
import { GameModeService } from '@/game-mode/GameModeService';
import { ComponentEmitOptions, Registry, RegistryComponentEvent, RegistryEvent } from '@/ecs/Registry';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { FlagService, FlagTankInteraction } from '@/flag/FlagService';
import { PlayerPointsEvent } from '@/player/PlayerPoints';
import { Config } from '@/config/Config';
import { TimeService, TimeServiceEvent } from '@/time/TimeService';
import { GameMap } from '@/maps/GameMap';
import { assert } from '@/utils/assert';
import { Component, ComponentFlags } from '@/ecs/Component';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { Entity } from '@/ecs/Entity';
import { EntityOwnedComponent } from '@/components/EntityOwnedComponent';
import { BulletComponent } from '@/components/BulletComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { MovementComponent } from '@/components/MovementComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { EntitySpawnerService } from '@/entity-spawner/EntitySpawnerService';
import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { FlagComponent } from '@/components/FlagComponent';
import { EntityId } from '@/ecs/EntityId';
import { RelativePositionComponent } from '@/components/RelativePositionComponent';
import { IsMovingTrackingComponent } from '@/components/IsMovingTrackingComponent';
import { DirtyCollisionType } from '@/components/DirtyCollisionsComponent';
import { DestroyedComponent } from '@/components/DestroyedComponent';
import { ComponentRegistry } from '@/ecs/ComponentRegistry';
import { TeleporterComponent } from '@/components/TeleporterComponent';

export enum GameServerEvent {
    PLAYER_BATCH = 'p',
    BROADCAST_BATCH = 'b',
}

export interface GameServerEvents {
    [GameServerEvent.BROADCAST_BATCH]: (events: BroadcastBatchGameEvent[]) => void;
    [GameServerEvent.PLAYER_BATCH]: (playerId: string, events: UnicastBatchGameEvent[]) => void;
}

export class GameServer {
    private componentRegistry;
    private registryIdGenerator;
    private registry;
    private entityBlueprint;

    private config;
    private gameModeService;
    private entityFactory;
    private gameMapService;
    private playerRepository;
    private playerService;
    private entityService;
    private entitySpawnerService;
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

        this.componentRegistry = new ComponentRegistry();
        this.registryIdGenerator = new RegistryNumberIdGenerator();
        this.registry = new Registry(this.componentRegistry, this.registryIdGenerator);
        this.entityBlueprint = new EntityBlueprint(this.config, BlueprintEnv.SERVER);
        this.entityBlueprint.reloadBlueprintData();

        this.entityFactory = new EntityFactory(this.registry, this.entityBlueprint);

        this.gameModeService = new GameModeService(this.config);
        this.boundingBoxRepository = new BoundingBoxRepository<number>(this.config);
        this.collisionRules = rules;
        this.collisionService = new CollisionService(
            this.boundingBoxRepository,
            this.registry,
            this.collisionRules,
        );
        this.entityService = new EntityService(this.registry);
        this.entitySpawnerService = new EntitySpawnerService(this.entityFactory, this.registry);
        this.tankService = new TankService(this.entityFactory, this.registry);
        this.flagService = new FlagService(this.config);
        this.bulletService = new BulletService(this.registry);
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
                this.gameEventBatcher.addBroadcastEvent([
                    GameEvent.ENTITY_REGISTERED,
                    {
                        id: entity.id,
                        type: entity.type,
                        subtypes: entity.subtypes,
                        components: entity.getComponentsData({
                            withoutFlags: ComponentFlags.LOCAL_ONLY,
                        }),
                    },
                ]);

                switch (entity.type) {
                    case EntityType.TANK: {
                        const playerId = entity
                            .getComponent(PlayerOwnedComponent).playerId;
                        this.playerService.setPlayerTankId(playerId, entity.id);
                        break;
                    }
                }

                this.entitySpawnerService.handleEntityRegistered(entity);
            });
        this.registry.emitter.on(RegistryEvent.ENTITY_BEFORE_DESTROY,
            (entity: Entity) => {
                switch (entity.type) {
                    case EntityType.TANK: {
                        const playerId = entity
                            .getComponent(PlayerOwnedComponent).playerId;
                        this.playerService.setPlayerTankId(playerId, null);
                        break;
                    }
                }

                this.entitySpawnerService.handleEntityDestroyed(entity);
                this.entityService.unattachRelativeEntities(entity);
                this.entityService.unattachRelativeEntity(entity);

                this.gameEventBatcher.addBroadcastEvent([GameEvent.ENTITY_UNREGISTERED, entity.id]);
            });

        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_CHANGED,
            (event, component, data, options) => {
                this.onRegistryComponentEvent(
                    event,
                    component,
                    data,
                    options,
                );
            });
        this.registry.componentEmitter(DestroyedComponent, true)
            .on(RegistryComponentEvent.COMPONENT_ADDED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyCollisions(entity,
                        DirtyCollisionType.REMOVE);
                });
        this.registry.componentEmitter(CenterPositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_INITIALIZED,
                (component) => {
                    const entity = component.entity;
                    this.entityService.updateCenterPosition(entity);
                });
        this.registry.componentEmitter(RelativePositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_INITIALIZED,
                (component) => {
                    const entity = component.entity;
                    this.entityService.updateRelativePosition(entity);
                });
        this.registry.componentEmitter(PositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyBoundingBox(entity);
                    this.entityService.markDirtyCenterPosition(entity);
                    this.entityService
                        .markRelativeChildrenDirtyPosition(entity);
                });
        this.registry.componentEmitter(SizeComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyBoundingBox(entity);
                    this.entityService.markDirtyCenterPosition(entity);
                });
        this.registry.componentEmitter(BoundingBoxComponent, true)
            .on(RegistryComponentEvent.COMPONENT_INITIALIZED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.updateBoundingBox(entity, true);
                });
        this.registry.componentEmitter(BoundingBoxComponent, true)
            .on(RegistryComponentEvent.COMPONENT_ADDED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyCollisions(entity,
                        DirtyCollisionType.ADD);
                });
        this.registry.componentEmitter(BoundingBoxComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.collisionService.markDirtyCollisions(entity,
                        DirtyCollisionType.UPDATE);
                });
        this.registry.componentEmitter(BoundingBoxComponent, true)
            .on(RegistryComponentEvent.COMPONENT_BEFORE_REMOVE,
                (component, options) => {
                    if (options?.destroy) {
                        return;
                    }

                    const entity = component.entity;
                    this.collisionService.markDirtyCollisions(entity,
                        DirtyCollisionType.REMOVE);
                });
        this.registry.componentEmitter(IsMovingTrackingComponent, true)
            .on(RegistryComponentEvent.COMPONENT_INITIALIZED,
                (component) => {
                    const entity = component.entity;
                    this.entityService.updateIsMoving(entity);
                });
        this.registry.componentEmitter(MovementComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.entityService.markDirtyIsMoving(entity);
                });
        this.registry.componentEmitter(HealthComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.entitySpawnerService.updateHealthBasedSmokeSpawner(entity);
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

                const tank = this.registry.getEntityById(player.tankId);
                this.entitySpawnerService.setEntitySpawnerStatus(tank,
                    BulletSpawnerComponent, isShooting);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_MOVE,
            (playerId: string, direction: Direction | undefined) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                if (direction === undefined) {
                    this.entityService.setMovementDirection(player.tankId, null);
                } else {
                    this.entityService.setMovementDirection(player.tankId, direction);
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

                    const position = this.entityService.getRandomSpawnPosition(player.teamId);
                    const tank = this.tankService.createTankForPlayer(player, position, tankColor);
                    this.tankService.createTankSpawnEffect(tank);
                } else if (status === PlayerSpawnStatus.DESPAWN && player.tankId !== null) {
                    const tank = this.registry.getEntityById(player.tankId);
                    this.entityService.markDestroyed(tank);
                }
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_DROP_FLAG,
            (playerId: string) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                const tank = this.registry.getEntityById(player.tankId);
                const carriedFlag = this.collisionService
                    .findRelativePositionEntityWithType(tank,
                        EntityType.FLAG);
                if (carriedFlag !== undefined) {
                    this.handleFlagDrop(tank, undefined, carriedFlag,
                        undefined, FlagTankInteraction.DROP);
                }
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
         * CollisionService event handlers
         */
        const spawnExplosion = (
            sourceOrPosition: Entity | Point,
            type: ExplosionType,
            destroyedType?: string,
        ) => {
            let position;
            if (sourceOrPosition instanceof Entity) {
                position = sourceOrPosition.getComponent(CenterPositionComponent);
            } else {
                position = sourceOrPosition;
            }

            this.entityFactory.buildFromOptions({
                type: EntityType.EXPLOSION,
                subtypes: [type],
                components: {
                    PositionComponent: position,
                    ExplosionComponent: {
                        destroyedType,
                    },
                },
            });
        };

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            (bulletId: EntityId, _staticEntityId: EntityId, _position: Point) => {
                const bullet = this.registry.getEntityById(bulletId);
                spawnExplosion(bullet, ExplosionType.SMALL, EntityType.NONE);
                this.entityService.markDestroyed(bullet);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            (bulletId: EntityId, steelWallId: EntityId, _position: Point) => {
                const bullet = this.registry.getEntityById(bulletId);
                const steelWall = this.registry.getEntityById(steelWallId);
                this.entityService.markDestroyed(bullet);
                const bulletPower = bullet.getComponent(BulletComponent).power;
                if (bulletPower === BulletPower.HEAVY) {
                    spawnExplosion(bullet, ExplosionType.SMALL);
                    this.entityService.markDestroyed(steelWall);
                } else {
                    spawnExplosion(bullet, ExplosionType.SMALL, EntityType.NONE);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BRICK_WALL,
            (bulletId: EntityId, brickWallId: EntityId, _position: Point) => {
                const destroyBox = this.bulletService.getBulletBrickWallDestroyBox(bulletId, brickWallId);
                const destroyBoxCenter = BoundingBoxUtils.center(destroyBox);
                const entityIds = this.collisionService.getOverlappingEntities(destroyBox);
                const entity = this.registry.getMultipleEntitiesById(entityIds);
                const bullet = this.registry.getEntityById(bulletId);
                spawnExplosion(destroyBoxCenter, ExplosionType.SMALL);
                this.entityService.markDestroyed(bullet);

                LazyIterable.from(entity)
                    .filter(o => o.type === EntityType.BRICK_WALL)
                    .forEach(brickWall => {
                        this.entityService.markDestroyed(brickWall);
                    });
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_TANK,
            (bulletId: EntityId, tankId: EntityId, _position: Point) => {
                const bullet = this.registry.getEntityById(bulletId);

                const bulletOwnerEntityId =
                    bullet.getComponent(EntityOwnedComponent).id;
                if (bulletOwnerEntityId === tankId) {
                    return;
                }

                const tank = this.registry.getEntityById(tankId);
                const tankHealth = tank.getComponent(HealthComponent);
                const bulletOwnerPlayerId =
                    bullet.getComponent(PlayerOwnedComponent).playerId;
                const tankOwnerPlayerId =
                    tank.getComponent(PlayerOwnedComponent).playerId;
                const tankPlayer = this.playerService.findPlayer(tankOwnerPlayerId);
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
                    const oldTankHealth = tankHealth.value;

                    this.tankService.decreaseTankHealth(tankId, bulletDamage);
                    bulletDamage -= oldTankHealth;

                    bulletComponent.update({
                        damage: bulletDamage,
                    });
                }

                if (tankHealth.value <= 0) {
                    const playerId =
                        tank.getComponent(PlayerOwnedComponent).playerId;
                    spawnExplosion(tank, ExplosionType.BIG, EntityType.TANK);
                    this.playerService.setPlayerRequestedSpawnStatus(playerId, PlayerSpawnStatus.DESPAWN);
                    this.playerService.addPlayerDeath(playerId);
                    if (bulletPlayer !== undefined) {
                        this.playerService.addPlayerKill(bulletPlayer.id);
                    }
                } else {
                    spawnExplosion(bullet, ExplosionType.SMALL, EntityType.NONE);
                }

                if (destroyBullet || bulletDamage <= 0) {
                    spawnExplosion(bullet, ExplosionType.SMALL);
                    this.entityService.markDestroyed(bullet);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            (
                movingBulletId: EntityId,
                staticBulletId: EntityId,
                _position: Point
            ) => {
                const movingBullet = this.registry.getEntityById(movingBulletId);
                const staticBullet = this.registry.getEntityById(staticBulletId);
                const movingBulletOwnerEntityId =
                    staticBullet.getComponent(EntityOwnedComponent).id;
                const staticBulletOwnerEntityId =
                    staticBullet.getComponent(EntityOwnedComponent).id;
                if (movingBulletOwnerEntityId === staticBulletOwnerEntityId) {
                    return;
                }

                spawnExplosion(movingBullet, ExplosionType.SMALL);
                this.entityService.markDestroyed(movingBullet);
                this.entityService.markDestroyed(staticBullet);
            });

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG,
            (tankId: EntityId, flagId: EntityId) => {
                const tank = this.registry.getEntityById(tankId);
                const flag = this.registry.getEntityById(flagId);
                const carriedFlag = this.collisionService
                    .findRelativePositionEntityWithType(tank,
                        EntityType.FLAG);
                const flagBase = this.collisionService
                    .findOverlappingWithType(flag, EntityType.FLAG_BASE);
                if (flag !== carriedFlag) {
                    this.handleFlagInteraction(tank, flag, carriedFlag, flagBase);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG_BASE,
            (tankId: EntityId, flagBaseId: EntityId) => {
                const tank = this.registry.getEntityById(tankId);
                const flagBase = this.registry.getEntityById(flagBaseId);
                const carriedFlag = this.collisionService
                    .findRelativePositionEntityWithType(tank,
                        EntityType.FLAG);
                this.handleFlagInteraction(tank, undefined, carriedFlag,
                    flagBase);
            });

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_TELEPORTER,
            (tankId: EntityId, teleporterId: EntityId) => {
                const tank = this.registry.getEntityById(tankId);
                const teleporter = this.registry.getEntityById(teleporterId);
                const target = teleporter.getComponent(TeleporterComponent).target;
                this.tankService.createTankSpawnEffect(tank);
                tank.upsertComponent(PositionComponent, target);
                this.tankService.createTankSpawnEffect(tank);
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
                this.timeService.decreaseRoundTime(deltaSeconds);
                if (this.timeService.isRoundEnded()) {
                    this.reload();
                }

                this.playerService.processPlayersStatus(deltaSeconds);
                this.entitySpawnerService.processActiveEntitySpawners();
                this.entityService.processDirection();
                this.collisionService.processRequestedDirection();
                this.entityService.processMovement(deltaSeconds);
                this.collisionService.processRequestedPosition();
                this.entityService.processDirtyRelativePosition();
                this.collisionService.processDirtyBoundingBox();
                this.entityService.processDirtyIsMoving();
                this.entityService.processDirtyCenterPosition();
                this.entityService.processAutomaticDestroy();
                this.collisionService.processDirtyCollisions();
                this.entityService.processDestroyed();
                this.gameEventBatcher.flush();
            });

        this.gameModeService.setGameMode(gameMode);
        this.gameMapService.loadByName(mapName);
        this.reload();
    }

    onRegistryComponentEvent<
        C extends Component<C>,
    >(
        event: RegistryComponentEvent,
        component: C,
        data?: any,
        options?: ComponentEmitOptions,
    ): void {
        if (component.flags & ComponentFlags.LOCAL_ONLY
            || event === RegistryComponentEvent.COMPONENT_ADDED
                && options?.register
            || event === RegistryComponentEvent.COMPONENT_BEFORE_REMOVE
                && options?.destroy) {
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
            if (data === undefined) {
                this.gameEventBatcher.addBroadcastEvent([
                    gameEvent,
                    component.entity.id,
                    component.clazz.tag,
                ]);
            } else {
                this.gameEventBatcher.addBroadcastEvent([
                    gameEvent,
                    component.entity.id,
                    component.clazz.tag,
                    data,
                ]);
            }
        }

    }

    handleFlagPick(
        tank: Entity,
        flag: Entity,
        flagBase: Entity | undefined,
    ): void {
        if (this.entityService.isAttachedRelativeEntity(flag)) {
            return;
        }

        this.entityService.attachRelativeEntity(tank, flag);
        this.flagService.setFlagSource(flag, flagBase);
    }

    handleFlagDrop(
        tank: Entity,
        flag: Entity | undefined,
        carriedFlag: Entity,
        flagBase: Entity | undefined,
        interaction: FlagTankInteraction,
    ): void {
        const playerId = tank.getComponent(PlayerOwnedComponent).playerId;
        let position;

        if (interaction === FlagTankInteraction.DROP) {
            position = tank.getComponent(PositionComponent);
        } else if (interaction === FlagTankInteraction.RETURN) {
            assert(flagBase !== undefined);

            position = flagBase.getComponent(PositionComponent);
        } else if (interaction === FlagTankInteraction.CAPTURE) {
            assert(flag !== undefined);
            assert(carriedFlag !== undefined);

            const flagComponent = carriedFlag.getComponent(FlagComponent);
            const carriedFlagBase = this.registry
                .getEntityById(flagComponent.sourceId);
            position = carriedFlagBase.getComponent(PositionComponent);
        } else {
            assert(false);
        }

        this.entityService.unattachRelativeEntity(carriedFlag);
        this.entityService.setEntityPosition(carriedFlag, position);
        this.flagService.setFlagDropper(carriedFlag, tank);

        if (interaction === FlagTankInteraction.RETURN) {
            this.playerService.addPlayerPoints(playerId,
                PlayerPointsEvent.RETURN_FLAG);
        } else if (interaction === FlagTankInteraction.CAPTURE) {
            this.playerService.addPlayerPoints(playerId,
                PlayerPointsEvent.CAPTURE_FLAG);
        }
    }

    handleFlagInteraction(
        tank: Entity,
        flag: Entity | undefined,
        carriedFlag: Entity | undefined,
        flagBase: Entity | undefined,
    ): void {
        const interaction = this.flagService
            .findFlagTankInteractionType(tank, flag, carriedFlag, flagBase);
        if (interaction === undefined) {
            return;
        }

        if (interaction === FlagTankInteraction.PICK) {
            assert(flag !== undefined);
            this.handleFlagPick(tank, flag, flagBase);
        } else if (interaction === FlagTankInteraction.DROP
            || interaction === FlagTankInteraction.RETURN
            || interaction === FlagTankInteraction.CAPTURE) {
            assert(carriedFlag !== undefined);
            this.handleFlagDrop(tank, flag, carriedFlag, flagBase, interaction);
        }
    }

    sendRequestedServerStatus(playerId?: string): void {
        const entities = this.registry.getEntities() as Iterable<Entity>;
        const entitiesOptions =
            LazyIterable.from(entities)
                .map(entity => {
                    return {
                        id: entity.id,
                        type: entity.type,
                        subtypes: entity.subtypes,
                        components: entity.getComponentsData({
                            withoutFlags: ComponentFlags.LOCAL_ONLY,
                        }),
                    };
                })
                .toArray() as Iterable<EntityBuildOptions>;

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
            'entities-blueprint',
            'game-client',
            'time',
        ]);

        const event: CommonBatchGameEvent = [GameEvent.SERVER_STATUS, {
            entitiesOptions,
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
        const entitiesOptions = gameMap.getEntitiesOptions();
        entitiesOptions
            .filter(o => this.gameModeService.isIgnoredEntityType(o.type))
            .forEach(o => this.entityFactory.buildFromOptions(o));

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

        this.entityService.markAllWorldEntitiesDestroyed();
        this.collisionService.processDirtyCollisions();
        this.entityService.processDestroyed();
        this.playerService.resetFields();
        this.gameEventBatcher.flush();

        const gameMap = this.gameMapService.getLoadedMap();
        assert(gameMap !== undefined, 'Cannot reload game without a loaded map');

        this.loadMap(gameMap);

        this.timeService.restartRoundTime();
        this.ticker.start();
    }
}
