import { BulletPower } from '@/subtypes/BulletPower';
import { Color } from '@/drawable/Color';
import { ExplosionType } from '@/subtypes/ExplosionType';
import { EntityFactory, EntityBuildOptions } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { Direction } from '@/physics/Direction';
import { TankTier } from '@/subtypes/TankTier';
import { Team } from '@/team/Team';
import { TeamService, TeamServiceEvent } from '@/team/TeamService';
import { LazyIterable } from '@/utils/LazyIterable';
import { MapRepository } from '@/utils/MapRepository';
import { Ticker, TickerEvent } from '@/utils/Ticker';
import EventEmitter from 'eventemitter3';
import { Action, ActionType } from '../actions/Action';
import { ButtonPressAction } from '../actions/ButtonPressAction';
import { GameMapService } from '../maps/GameMapService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { CollisionService, DirtyCollisionType } from '../physics/collisions/CollisionService';
import { CollisionEvent } from '../physics/collisions/CollisionRule';
import { Player, PartialPlayerOptions, PlayerSpawnStatus } from '../player/Player';
import { PlayerService, PlayerServiceEvent } from '@/player/PlayerService';
import { BroadcastBatchGameEvent, CommonBatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import { GameEventBatcher, GameEventBatcherEvent } from './GameEventBatcher';
import { GameModeService, SameTeamBulletHitMode } from '@/services/GameModeService';
import { ComponentEmitOptions, Registry, RegistryComponentEvent, RegistryEvent } from '@/ecs/Registry';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
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
import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { RelativePositionComponent } from '@/components/RelativePositionComponent';
import { DestroyedComponent } from '@/components/DestroyedComponent';
import { ComponentRegistry } from '@/ecs/ComponentRegistry';
import { TeleporterComponent } from '@/components/TeleporterComponent';
import { getBrickWallDestroyBox } from '@/logic/brick-wall';
import { createSpawnEffect } from '@/logic/spawn-effect';
import { createTankForPlayer, decreaseTankHealth, onTankCollideFlag, onTankCollideFlagBase } from '@/logic/tank';
import { createExplosion } from '@/logic/explosion';
import { handleSpawnedEntityDestroyed, handleSpawnedEntityRegistered, processActiveEntitySpawners, setEntitySpawnerStatus, updateHealthBasedSmokeSpawner } from '@/logic/entity-spawner';
import { FlagTankInteraction, handleFlagDrop, handleFlagInteraction } from '@/logic/flag';
import { processDirection, processMovement, setMovementDirection, updateIsMoving } from '@/logic/entity-movement';
import { pickRandomSpawnPosition } from '@/logic/spawn';
import { SpawnComponent } from '@/components/SpawnComponent';
import { markAllWorldEntitiesDestroyed, markDestroyed, processAutomaticDestroy, processDestroyed } from '@/logic/entity-destroy';
import { unattachRelativeEntities, unattachRelativeEntity, updateRelativePosition, markRelativeChildrenDirtyPosition, processDirtyRelativePosition } from '@/logic/entity-relative-position';
import { updateCenterPosition } from '@/logic/entity-position';
import { onBulletHitBrickWall, onBulletHitBullet, onBulletHitLevelBorder, onBulletHitSteelWall, onBulletHitTank } from '@/logic/bullet';
import { PluginContext } from '@/logic/plugin';
import { onEntityCollideTeleporter } from '@/logic/entity-teleporter';

export enum GameServerEvent {
    PLAYER_BATCH = 'p',
    BROADCAST_BATCH = 'b',
}

export interface GameServerEvents {
    [GameServerEvent.BROADCAST_BATCH]: (events: BroadcastBatchGameEvent[]) => void;
    [GameServerEvent.PLAYER_BATCH]: (playerId: string, events: UnicastBatchGameEvent[]) => void;
}

export class GameServer {
    private registry;

    private config;
    private gameModeService;
    private entityFactory;
    private gameMapService;
    private playerRepository;
    private playerService;
    private collisionService;
    private gameEventBatcher;
    private teamRepository;
    private teamService;
    private timeService;
    private pluginContext;
    ticker;

    emitter = new EventEmitter<GameServerEvents>();

    constructor(mapName: string, gameMode: string) {
        this.config = new Config();
        this.config.loadDir('./configs');

        const componentRegistry = new ComponentRegistry();
        const registryIdGenerator = new RegistryNumberIdGenerator();
        const entityBlueprint = new EntityBlueprint(this.config, BlueprintEnv.SERVER);

        this.registry = new Registry(componentRegistry, registryIdGenerator);
        this.entityFactory = new EntityFactory(this.registry, entityBlueprint);

        entityBlueprint.reloadBlueprintData();

        const boundingBoxRepository = new BoundingBoxRepository<number>(this.config);

        this.gameModeService = new GameModeService(this.config);
        this.collisionService = new CollisionService(boundingBoxRepository, this.registry);
        this.gameMapService = new GameMapService(entityBlueprint);
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.config, this.playerRepository);
        this.teamRepository = new MapRepository<string, Team>();
        this.teamService = new TeamService(this.teamRepository);
        this.timeService = new TimeService(this.config);
        this.gameEventBatcher = new GameEventBatcher();

        const ticksPerSecond = this.config.get<number>('game-server', 'ticksPerSecond');
        this.ticker = new Ticker(ticksPerSecond);

        this.pluginContext = {
            registry: this.registry,
            entityFactory: this.entityFactory,
            collisionService: this.collisionService,
            gameModeService: this.gameModeService,
            playerService: this.playerService,
        };

        const bindContext = (fn: Function) => fn.bind(this.pluginContext);

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
                        this.playerService.setPlayerTank(playerId, entity);
                        break;
                    }
                }

                handleSpawnedEntityRegistered(this.registry, entity);
            });
        this.registry.emitter.on(RegistryEvent.ENTITY_BEFORE_DESTROY,
            (entity: Entity) => {
                switch (entity.type) {
                    case EntityType.TANK: {
                        const playerId = entity
                            .getComponent(PlayerOwnedComponent).playerId;
                        this.playerService.setPlayerTank(playerId, null);
                        break;
                    }
                }

                handleSpawnedEntityDestroyed(this.registry, entity);
                unattachRelativeEntities(this.registry, entity);
                unattachRelativeEntity(this.registry, entity);

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
                    updateCenterPosition(entity, true);
                });
        this.registry.componentEmitter(RelativePositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_INITIALIZED,
                (component) => {
                    const entity = component.entity;
                    updateRelativePosition(this.registry, entity, true);
                });
        this.registry.componentEmitter(PositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    updateCenterPosition(entity);
                    this.collisionService.updateBoundingBox(entity);
                    markRelativeChildrenDirtyPosition(this.registry, entity);
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
        this.registry.componentEmitter(MovementComponent, true)
            .on(RegistryComponentEvent.COMPONENT_ADD_OR_UPDATE,
                (_event, component) => {
                    const entity = component.entity;
                    updateIsMoving(entity);
                });
        this.registry.componentEmitter(HealthComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    updateHealthBasedSmokeSpawner(entity);
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
                setEntitySpawnerStatus(tank, BulletSpawnerComponent, isShooting);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_MOVE,
            (playerId: string, direction: Direction | undefined) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                const tank = this.registry.getEntityById(player.tankId);
                setMovementDirection(tank, direction);
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

                    const entities = this.registry.getEntitiesWithComponent(SpawnComponent);
                    const position = pickRandomSpawnPosition(entities, player.teamId);
                    createTankForPlayer(this.entityFactory, player, position, tankColor);
                    createSpawnEffect(this.entityFactory, position);
                } else if (status === PlayerSpawnStatus.DESPAWN && player.tankId !== null) {
                    const tank = this.registry.getEntityById(player.tankId);
                    markDestroyed(tank);
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
                    handleFlagDrop(this.registry, this.playerService,
                        tank, undefined, carriedFlag, undefined,
                        FlagTankInteraction.DROP);
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
        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            bindContext(onBulletHitLevelBorder));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            bindContext(onBulletHitSteelWall));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BRICK_WALL,
            bindContext(onBulletHitBrickWall));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_TANK,
            bindContext(onBulletHitTank));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            bindContext(onBulletHitBullet));

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG,
            bindContext(onTankCollideFlag));

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG_BASE,
            bindContext(onTankCollideFlagBase));

        this.collisionService.emitter.on(CollisionEvent.ENTITY_COLLIDE_TELEPORTER,
            bindContext(onEntityCollideTeleporter));

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
                processActiveEntitySpawners(this.registry, this.entityFactory);
                processDirection(this.registry);
                this.collisionService.processRequestedDirection();
                processMovement(this.registry, deltaSeconds);
                this.collisionService.processRequestedPosition();
                processDirtyRelativePosition(this.registry);
                processAutomaticDestroy(this.registry);
                this.collisionService.processDirtyCollisions();
                processDestroyed(this.registry);
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
        } else if (gameEvent === GameEvent.ENTITY_COMPONENT_ADDED) {
            this.gameEventBatcher.addBroadcastEvent([
                gameEvent,
                component.entity.id,
                component.clazz.tag,
                component.getData(),
            ]);
        } else if (gameEvent === GameEvent.ENTITY_COMPONENT_UPDATED) {
            this.gameEventBatcher.addBroadcastEvent([
                gameEvent,
                component.entity.id,
                component.clazz.tag,
                data,
            ]);
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

        markAllWorldEntitiesDestroyed(this.registry);
        this.collisionService.processDirtyCollisions();
        processDestroyed(this.registry);
        this.playerService.resetFields();
        this.gameEventBatcher.flush();

        const gameMap = this.gameMapService.getLoadedMap();
        assert(gameMap !== undefined, 'Cannot reload game without a loaded map');

        this.loadMap(gameMap);

        this.timeService.restartRoundTime();
        this.ticker.start();
    }
}
