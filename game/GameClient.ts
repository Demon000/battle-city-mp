import { GameCamera } from '@/renderer/GameCamera';
import { GameGraphicsService } from '@/renderer/GameGraphicsService';
import { Ticker, TickerEvent } from '@/utils/Ticker';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { CollisionService, DirtyCollisionType } from '../physics/collisions/CollisionService';
import { GameServerStatus } from './GameServerStatus';
import { EntityFactory, EntityBuildOptions } from '@/entity/EntityFactory';
import EventEmitter from 'eventemitter3';
import { PlayerStats } from '@/player/PlayerStats';
import { LazyIterable } from '@/utils/LazyIterable';
import { TankTier } from '@/subtypes/TankTier';
import { Color } from '@/drawable/Color';
import { Config, ConfigEvent } from '@/config/Config';
import { TimeService, TimeServiceEvent } from '@/time/TimeService';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { Registry, RegistryComponentEvent, RegistryEvent } from '@/ecs/Registry';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { EntityId } from '@/ecs/EntityId';
import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { Entity } from '@/ecs/Entity';
import { ClientComponentLookupTable } from '@/ecs/ClientComponentLookupTable';
import { EntityGraphicsRenderer } from '@/entity/EntityGraphicsRenderer';
import { updateIsMoving } from '@/logic/entity-movement';
import { updateCenterPosition } from '@/logic/entity-position';
import { PlayerComponent } from '@/components/PlayerComponent';
import { getPlayerColor, getPlayerName, getPlayerTankId, getRoundedRespawnTimeout, getSortedPlayers } from '@/logic/player';
import { TeamComponent } from '@/components/TeamComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { ColorComponent } from '@/components/ColorComponent';
import { PlayerRequestedSpawnComponent } from '@/components/PlayerRequestedSpawnComponent';
import { EntitiesOwnerComponent } from '@/components/EntitiesOwnerComponent';
import { PlayerRespawnTimeoutComponent } from '@/components/PlayerRespawnTimeoutComponent';
import { NameComponent } from '@/components/NameComponent';
import { GameEventBatcher, GameEventBatcherEvent } from './GameEventBatcher';
import { BatchGameEvent, GameEvent } from './GameEvent';
import { assert } from '@/utils/assert';

export enum GameClientEvent {
    PLAYERS_CHANGED = 'players-changed',
    TEAMS_CHANGED = 'teams-changed',
    ROUND_TIME_UPDATED = 'round-time-updated',
    ROUND_TIME_RESTART = 'round-time-restart',
    SCOREBOARD_WATCH_TIME = 'scoreboard-watch-time',

    OWN_PLAYER_ADDED = 'own-player-added',
    OWN_PLAYER_CHANGED_NAME = 'own-player-changed-name',
    OWN_PLAYER_CHANGED_TANK_ID = 'own-player-changed-tank-id',
    OWN_PLAYER_CHANGED_TEAM_ID = 'own-player-changed-team-id',
    OWN_PLAYER_CHANGED_TANK_TIER = 'own-player-changed-tank-tier',
    OWN_PLAYER_CHANGED_TANK_COLOR = 'own-player-changed-tank-color',

    OWN_PLAYER_TANK_CHANGED_MAX_HEALTH = 'own-player-tank-changed-max-health',
    OWN_PLAYER_TANK_CHANGED_HEALTH = 'own-player-tank-changed-health',
    OWN_PLAYER_TANK_CHANGED_MAX_BULLETS = 'own-player-tank-changed-max-bullets',
    OWN_PLAYER_TANK_CHANGED_BULLETS = 'own-player-tank-changed-bullets',
    OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT = 'own-player-changed-respawn-timeout',
    OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS = 'own-player-changed-requested-spawn-status',

    TICK = 'tick',
}

export interface GameClientEvents {
    [GameClientEvent.PLAYERS_CHANGED]: () => void;
    [GameClientEvent.TEAMS_CHANGED]: () => void;
    [GameClientEvent.ROUND_TIME_UPDATED]: (roundTimeSeconds: number) => void;
    [GameClientEvent.ROUND_TIME_RESTART]: () => void;
    [GameClientEvent.SCOREBOARD_WATCH_TIME]: (value: boolean) => void;

    [GameClientEvent.OWN_PLAYER_ADDED]: () => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_NAME]: (name: string) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID]: (tankId: EntityId | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID]: (teamId: string | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER]: (tier: TankTier) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR]: (color: Color) => void;

    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH]: (maxHealth: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH]: (health: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS]: (maxBullets: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS]: (bullets: number) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT]: (respawnTimeout: number) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS]: (value: boolean) => void;

    [GameClientEvent.TICK]: () => void;
}

export class GameClient {
    private config;

    private registry;

    private entityFactory;
    private collisionService;
    private gameCamera;
    private gameGraphicsService;
    private timeService;
    private ownPlayerId: string | null = null;
    gameEventBatcher;
    emitter;
    ticker;

    constructor(canvases: HTMLCanvasElement[]) {
        this.config = new Config();
        this.gameEventBatcher = new GameEventBatcher();

        const componentRegistry = new ClientComponentLookupTable();
        const registryIdGenerator = new RegistryNumberIdGenerator();
        const entityBlueprint = new EntityBlueprint(this.config, BlueprintEnv.CLIENT);
        this.registry = new Registry(componentRegistry, registryIdGenerator);
        this.entityFactory = new EntityFactory(this.registry, entityBlueprint);

        const boundingBoxRepository = new BoundingBoxRepository<EntityId>();
        const entityGraphicsRenderer = new EntityGraphicsRenderer();

        this.collisionService = new CollisionService(boundingBoxRepository, this.registry);
        this.gameCamera = new GameCamera();
        this.gameGraphicsService = new GameGraphicsService(this.registry,
            entityGraphicsRenderer, canvases);
        this.timeService = new TimeService(this.config);
        this.emitter = new EventEmitter<GameClientEvents>();
        this.ticker = new Ticker();

        const isOwnPlayer = (player: Entity) => player.id === this.ownPlayerId;
        const isOwnTank = (tank: Entity) => {
            const playerOwnedComponent = tank
                .findComponent(PlayerOwnedComponent);
            if (playerOwnedComponent === undefined) {
                return;
            }

            return playerOwnedComponent.playerId === this.ownPlayerId;
        };

        this.gameEventBatcher.emitter.on(GameEventBatcherEvent.BROADCAST_BATCH,
            this.onBroadcastEvents, this);
        this.config.emitter.on(ConfigEvent.CONFIG_SET,
            () => {
                entityBlueprint.reloadBlueprintData();
            });
        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_CHANGED,
            (component) => {
                if (component.entities.size !== 1) {
                    return;
                }

                const entity = component.entity;
                this.gameGraphicsService
                    .processGraphicsDependencies(entity, component.clazz.tag);
            });
        this.registry.emitter.on(RegistryEvent.ENTITY_BEFORE_DESTROY,
            (entity: Entity) => {
                this.collisionService.removeCollisions(entity);
            });
        this.registry.componentEmitter(CenterPositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_INITIALIZED,
                (component) => {
                    const entity = component.entity;
                    updateCenterPosition(entity, true);
                });
        this.registry.componentEmitter(PositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    updateCenterPosition(entity);
                    this.collisionService.updateBoundingBox(entity);
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
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    updateIsMoving(entity);
                });
        this.registry.componentEmitter(HealthComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component) => {
                    const entity = component.entity;
                    if (!isOwnTank(entity)) {
                        return;
                    }

                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                        component.value,
                    );

                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                        component.max,
                    );
                });
        this.registry.componentEmitter(BulletSpawnerComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component) => {
                    const entity = component.entity;
                    if (!isOwnTank(entity)) {
                        return;
                    }

                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
                        component.count,
                    );

                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
                        component.maxCount,
                    );
                });
        this.registry.componentEmitter(PlayerComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component, options) => {
                    this.emitter.emit(GameClientEvent.PLAYERS_CHANGED);

                    const entity = component.entity;
                    if (!isOwnPlayer(entity)) {
                        return;
                    }

                    if (options?.register) {
                        this.emitter.emit(GameClientEvent.OWN_PLAYER_ADDED);
                    }

                    this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER,
                        component.requestedTankTier);
                });
        this.registry.componentEmitter(NameComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component) => {
                    this.emitter.emit(GameClientEvent.PLAYERS_CHANGED);

                    const entity = component.entity;
                    if (!isOwnPlayer(entity)) {
                        return;
                    }

                    this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_NAME,
                        getPlayerName(entity));
                });
        this.registry.componentEmitter(PlayerRespawnTimeoutComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component) => {
                    const entity = component.entity;
                    if (!isOwnPlayer(entity)) {
                        return;
                    }

                    this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT,
                        getRoundedRespawnTimeout(entity));
                });
        this.registry.componentEmitter(EntitiesOwnerComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component) => {
                    const entity = component.entity;
                    if (!isOwnPlayer(entity)) {
                        return;
                    }

                    this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID,
                        getPlayerTankId(entity));
                });
        this.registry.componentEmitter(ColorComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component) => {
                    const entity = component.entity;
                    if (!isOwnPlayer(entity)) {
                        return;
                    }

                    this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR,
                        component.value);
                });
        this.registry.componentEmitter(TeamOwnedComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component) => {
                    const entity = component.entity;
                    if (!isOwnPlayer(entity)) {
                        return;
                    }

                    this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID,
                        component.teamId);
                });
        this.registry.componentEmitter(PlayerRequestedSpawnComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (component, options) => {
                    const entity = component.entity;
                    if (!isOwnPlayer(entity)) {
                        return;
                    }

                    let event = options.event;
                    this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS,
                        event === RegistryComponentEvent.COMPONENT_ADDED);
                });
        this.registry.componentEmitter(TeamComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                () => {
                    this.emitter.emit(GameClientEvent.TEAMS_CHANGED);
                });

        this.timeService.emitter.on(TimeServiceEvent.ROUND_TIME_UPDATED,
            (roundTimeSeconds: number) => {
                this.emitter.emit(GameClientEvent.ROUND_TIME_UPDATED, roundTimeSeconds);
            });
        this.timeService.emitter.on(TimeServiceEvent.ROUND_TIME_RESTART,
            () => {
                this.emitter.emit(GameClientEvent.ROUND_TIME_RESTART);
            });
        this.timeService.emitter.on(TimeServiceEvent.SCOREBOARD_WATCH_TIME,
            (value: boolean) => {
                this.emitter.emit(GameClientEvent.SCOREBOARD_WATCH_TIME, value);
            });

        this.ticker.emitter.on(TickerEvent.TICK, this.onTick, this);
    }

    onBroadcastEvent(batch: BatchGameEvent) {
        switch (batch[0]) {
            case GameEvent.SERVER_STATUS:
                this.onServerStatus(batch[1]);
                break;
            case GameEvent.ENTITY_REGISTERED:
                this.onEntityRegistered(batch[1]);
                break;
            case GameEvent.ENTITY_UNREGISTERED:
                this.onEntityUnregistered(batch[1]);
                break;
            case GameEvent.ENTITY_COMPONENT_ADDED:
                this.onEntityComponentAdded(batch[1], batch[2], batch[3]);
                break;
            case GameEvent.ENTITY_COMPONENT_UPDATED:
                this.onEntityComponentUpdated(batch[1], batch[2], batch[3]);
                break;
            case GameEvent.ENTITY_COMPONENT_REMOVED:
                this.onEntityComponentRemoved(batch[1], batch[2]);
                break;
            case GameEvent.ROUND_TIME_UPDATED:
                this.onRoundTimeUpdated(batch[1]);
                break;
            default:
                assert(false, `Invalid event '${batch[0]}'`);
        }
    }

    onBroadcastEvents(events: BatchGameEvent[]) {
        for (const batch of events) {
            this.onBroadcastEvent(batch);
        }
    }

    onEntityRegistered(buildOptions: EntityBuildOptions): void {
        this.entityFactory.buildFromOptions(buildOptions);
    }

    onEntityUnregistered(entityId: EntityId): void {
        const entity = this.registry.getEntityById(entityId);
        entity.destroy();
    }

    onEntityComponentAdded(entityId: EntityId, tag: string, data: any): void {
        const entity = this.registry.getEntityById(entityId);
        entity.addComponent(tag, data);
    }

    onEntityComponentUpdated(entityId: EntityId, tag: string, data: any): void {
        const entity = this.registry.getEntityById(entityId);
        entity.updateComponent(tag, data);
    }

    onEntityComponentRemoved(entityId: EntityId, tag: string): void {
        const entity = this.registry.getEntityById(entityId);
        entity.removeComponent(tag);
    }

    onServerStatus(serverStatus: GameServerStatus): void {
        this.config.clear();
        const configsData = serverStatus.configsData;
        this.config.setMultiple(configsData);

        LazyIterable.from(serverStatus.entitiesOptions)
            .forEach(o => this.entityFactory.buildFromOptions(o));

        const maxVisibleGameSize = this.config.get<number>('game-client',
            'maxVisibleGameSize');
        this.gameGraphicsService.setMaxVisibleGameSize(maxVisibleGameSize);
    }

    onTick(): void {
        this.gameEventBatcher.flush();
        this.collisionService.processDirtyCollisions();
        this.gameGraphicsService.processDirtyGraphics();

        if (this.ownPlayerId === null) {
            return;
        }

        const ownPlayer = this.registry.findEntityById(this.ownPlayerId);
        if (ownPlayer === undefined) {
            return;
        }

        const ownPlayerTankId = getPlayerTankId(ownPlayer);
        if (ownPlayerTankId !== null) {
            const tank = this.registry.findEntityById(ownPlayerTankId);
            if (tank !== undefined) {
                const centerPosition = tank.getComponent(CenterPositionComponent);
                this.gameCamera.setPosition(centerPosition);
            }
        }

        const position = this.gameCamera.getPosition();
        if (position === undefined) {
            return;
        }

        const box = this.gameGraphicsService.getViewableMapBoundingBox(position);
        if (box === undefined) {
            return;
        }

        const viewableEntityIds = this.collisionService
            .getOverlappingEntities(box);
        const viewableEntities = this.registry
            .getEntitiesById(viewableEntityIds) as Iterable<Entity>;
        this.gameGraphicsService.initializeRender(position);
        this.gameGraphicsService.renderEntites(viewableEntities);

        this.emitter.emit(GameClientEvent.TICK);
    }

    onWindowResize(): void {
        this.gameGraphicsService.calculateDimensions();
    }

    setOwnPlayerId(playerId: string): void {
        this.ownPlayerId = playerId;
    }

    getStats(): PlayerStats[] {
        return getSortedPlayers(this.registry)
            .map(player => {
                const playerTankId = getPlayerTankId(player);
                let tank;
                if (playerTankId !== null) {
                    tank = this.registry.getEntityById(playerTankId);
                }

                const playerComponent = player.getComponent(PlayerComponent);
                let tier;
                if (tank !== undefined) {
                    tier = tank.subtypes[0];
                } else {
                    tier = playerComponent.requestedTankTier;
                }

                const color = getPlayerColor(this.registry, player);
                const name = getPlayerName(player);
                return {
                    id: player.id,
                    name: name,
                    kills: playerComponent.kills,
                    deaths: playerComponent.deaths,
                    points: playerComponent.points,
                    color,
                    tier,
                };
            });
    }

    getTeams(): Entity[] | undefined {
        const teams = this.registry.getEntitiesWithComponent(TeamComponent);

        return Array.from(teams);
    }

    getOwnPlayer(): Entity | undefined {
        if (this.ownPlayerId === null) {
            return undefined;
        }

        return this.registry.getEntityById(this.ownPlayerId);
    }

    onRoundTimeUpdated(roundSeconds: number): void {
        this.timeService.setRoundTime(roundSeconds);
    }
}
