import { GameCamera } from '@/renderer/GameCamera';
import { GameGraphicsService } from '@/renderer/GameGraphicsService';
import { MapRepository } from '@/utils/MapRepository';
import { Ticker, TickerEvent } from '@/utils/Ticker';
import { EntityService } from '../entity/EntityService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { CollisionService } from '../physics/collisions/CollisionService';
import { Player, PartialPlayerOptions, PlayerOptions, PlayerSpawnStatus } from '../player/Player';
import { PlayerService, PlayerServiceEvent } from '@/player/PlayerService';
import { GameServerStatus } from './GameServerStatus';
import { EntityFactory, EntityBuildOptions } from '@/entity/EntityFactory';
import EventEmitter from 'eventemitter3';
import { Team } from '@/team/Team';
import { TeamService, TeamServiceEvent } from '@/team/TeamService';
import { PlayerStats } from '@/player/PlayerStats';
import { TankService } from '@/services/TankService';
import { LazyIterable } from '@/utils/LazyIterable';
import { TankTier } from '@/subtypes/TankTier';
import { Color } from '@/drawable/Color';
import { Config } from '@/config/Config';
import { TimeService, TimeServiceEvent } from '@/time/TimeService';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { Registry, RegistryComponentEvent } from '@/ecs/Registry';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { EntityId } from '@/ecs/EntityId';
import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { DestroyedComponent } from '@/components/DestroyedComponent';
import { Entity } from '@/ecs/Entity';
import { DirtyCollisionType } from '@/components/DirtyCollisionsComponent';
import { ClientComponentRegistry } from '@/ecs/ClientComponentRegistry';
import { EntityGraphicsRenderer } from '@/entity/EntityGraphicsRenderer';
import { ComponentFlags } from '@/ecs/Component';

export enum GameClientEvent {
    PLAYERS_CHANGED = 'players-changed',
    TEAMS_CHANGED = 'teams-changed',
    ROUND_TIME_UPDATED = 'round-time-updated',
    ROUND_TIME_RESTART = 'round-time-restart',
    SCOREBOARD_WATCH_TIME = 'scoreboard-watch-time',

    OWN_PLAYER_ADDED = 'own-player-added',
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

    FLUSH_EVENTS = 'flush-events',
    TICK = 'tick',
}

export interface GameClientEvents {
    [GameClientEvent.PLAYERS_CHANGED]: () => void;
    [GameClientEvent.TEAMS_CHANGED]: () => void;
    [GameClientEvent.ROUND_TIME_UPDATED]: (roundTimeSeconds: number) => void;
    [GameClientEvent.ROUND_TIME_RESTART]: () => void;
    [GameClientEvent.SCOREBOARD_WATCH_TIME]: (value: boolean) => void;

    [GameClientEvent.OWN_PLAYER_ADDED]: () => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID]: (tankId: EntityId | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID]: (teamId: string | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER]: (tier: TankTier) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR]: (color: Color) => void;

    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH]: (maxHealth: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH]: (health: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS]: (maxBullets: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS]: (bullets: number) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT]: (respawnTimeout: number) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS]: (requestedSpawnStatus: PlayerSpawnStatus) => void;

    [GameClientEvent.FLUSH_EVENTS]: () => void;
    [GameClientEvent.TICK]: () => void;
}

export class GameClient {
    private config;

    private componentRegistry;
    private registryIdGenerator;
    private registry;
    private entityBlueprint;

    private entityFactory;
    private playerRepository;
    private playerService;
    private teamRepository;
    private teamService;
    private entityService;
    private tankService;
    private boundingBoxRepository;
    private collisionService;
    private gameCamera;
    private entityGraphicsRenderer;
    private gameGraphicsService;
    private timeService;
    emitter;
    ticker;

    constructor(canvases: HTMLCanvasElement[]) {
        this.config = new Config();

        this.componentRegistry = new ClientComponentRegistry();
        this.registryIdGenerator = new RegistryNumberIdGenerator();
        this.registry = new Registry(this.componentRegistry, this.registryIdGenerator);
        this.entityBlueprint = new EntityBlueprint(this.registry, this.config, BlueprintEnv.CLIENT);
        this.entityFactory = new EntityFactory(this.registry, this.entityBlueprint);

        this.boundingBoxRepository = new BoundingBoxRepository<number>(this.config);
        this.collisionService = new CollisionService(this.boundingBoxRepository, this.registry);
        this.entityService = new EntityService(this.entityFactory, this.registry);
        this.tankService = new TankService(this.entityFactory, this.registry);
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.config, this.playerRepository);
        this.teamRepository = new MapRepository<string, Team>();
        this.teamService = new TeamService(this.teamRepository);
        this.gameCamera = new GameCamera();
        this.entityGraphicsRenderer = new EntityGraphicsRenderer();
        this.gameGraphicsService = new GameGraphicsService(this.registry,
            this.entityGraphicsRenderer, canvases);
        this.timeService = new TimeService(this.config);
        this.emitter = new EventEmitter<GameClientEvents>();
        this.ticker = new Ticker();

        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_CHANGED,
            (_event, component) => {
                if (component.flags & ComponentFlags.SHARED) {
                    return;
                }

                this.gameGraphicsService
                    .processGraphicsDependencies(component.entity.id,
                        component.clazz.tag);
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
                    this.entityService.updateCenterPosition(entity, true);
                });
        this.registry.componentEmitter(PositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_UPDATED,
                (component) => {
                    const entity = component.entity;
                    this.entityService.updateCenterPosition(entity);
                    this.collisionService.markDirtyBoundingBox(entity);
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
                    this.entityService.updateIsMoving(entity);
                });
        this.registry.componentEmitter(HealthComponent, true)
            .on(RegistryComponentEvent.COMPONENT_ADD_OR_UPDATE,
                (_event, component) => {
                    const entity = component.entity;
                    if (entity.id === this.tankService.getOwnPlayerTankId()) {
                        this.emitter.emit(
                            GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                            component.value,
                        );

                        this.emitter.emit(
                            GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                            component.max,
                        );
                    }
                });
        this.registry.componentEmitter(BulletSpawnerComponent, true)
            .on(RegistryComponentEvent.COMPONENT_ADD_OR_UPDATE,
                (_event, component) => {
                    const entity = component.entity;
                    if (entity.id === this.tankService.getOwnPlayerTankId()) {
                        this.emitter.emit(
                            GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
                            component.count,
                        );

                        this.emitter.emit(
                            GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
                            component.maxCount,
                        );
                    }
                });

        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_ADDED, () => {
            this.emitter.emit(GameClientEvent.OWN_PLAYER_ADDED);
        });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_ID,
            (tankId: EntityId | null) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID, tankId);
                this.tankService.setOwnPlayerTankId(tankId);
                if (tankId !== null) {
                    const tank = this.registry.getEntityById(tankId);
                    const health = tank.getComponent(HealthComponent);
                    const bulletSpawner = tank.getComponent(BulletSpawnerComponent);
                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                        health.value,
                    );
                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                        health.max,
                    );
                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
                        bulletSpawner.count,
                    );
                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
                        bulletSpawner.maxCount,
                    );
                }
            });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_TEAM_ID,
            (teamId: string | null) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID, teamId);
            });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_TIER,
            (tier: TankTier) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER, tier);
            });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_COLOR,
            (color: Color) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR, color);
            });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT,
            (respawnTimeout: number) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT, respawnTimeout);
            });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS,
            (requestedSpawnStatus: PlayerSpawnStatus) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS, requestedSpawnStatus);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYERS_CHANGED,
            () => {
                this.emitter.emit(GameClientEvent.PLAYERS_CHANGED);
            });

        this.teamService.emitter.on(TeamServiceEvent.TEAMS_CHANGED,
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

    onEntityRegistered(buildOptions: EntityBuildOptions): void {
        this.entityFactory.buildFromOptions(buildOptions);
    }

    onEntityUnregistered(entityId: EntityId): void {
        const entity = this.registry.getEntityById(entityId);
        this.entityService.markDestroyed(entity);
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

    onPlayerAdded(playerOptions: PlayerOptions): void {
        const player = new Player(playerOptions);
        this.playerService.addPlayer(player);
    }

    onPlayerChanged(playerId: string, playerOptions: PartialPlayerOptions): void {
        this.playerService.updatePlayer(playerId, playerOptions);
    }

    onPlayerRemoved(playerId: string): void {
        this.playerService.removePlayer(playerId);
    }

    onTeamPlayerAdded(teamId: string, playerId: string): void {
        this.teamService.addTeamPlayer(teamId, playerId);
    }

    onTeamPlayerRemoved(teamId: string, playerId: string): void {
        this.teamService.removeTeamPlayer(teamId, playerId);
    }

    onServerStatus(serverStatus: GameServerStatus): void {
        this.config.clear();
        const configsData = serverStatus.configsData;
        this.config.setMultiple(configsData);
        this.entityBlueprint.reloadBlueprintData();

        this.playerService.clear();
        const players =
            LazyIterable.from(serverStatus.playersOptions)
                .map(o => new Player(o));
        this.playerService.addPlayers(players);

        if (serverStatus.teamsOptions !== undefined) {
            const teams =
            LazyIterable.from(serverStatus.teamsOptions)
                .map(o => new Team(o));
            this.teamService.addTeams(teams);
        }

        LazyIterable.from(serverStatus.entitiesOptions)
            .forEach(o => this.entityFactory.buildFromOptions(o));

        const maxVisibleGameSize = this.config.get<number>('game-client',
            'maxVisibleGameSize');
        this.gameGraphicsService.setMaxVisibleGameSize(maxVisibleGameSize);
    }

    onTick(): void {
        this.emitter.emit(GameClientEvent.FLUSH_EVENTS);

        this.collisionService.processDirtyBoundingBox();
        this.collisionService.processDirtyCollisions();
        this.gameGraphicsService.processDirtyGraphics();
        this.entityService.processDestroyed();

        const ownPlayer = this.playerService.getOwnPlayer();
        if (ownPlayer === undefined) {
            return;
        }

        if (ownPlayer.tankId !== null) {
            const tank = this.registry.findEntityById(ownPlayer.tankId);
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
            .getMultipleEntitiesById(viewableEntityIds) as Iterable<Entity>;
        this.gameGraphicsService.initializeRender(position);
        this.gameGraphicsService.renderEntites(viewableEntities);

        this.emitter.emit(GameClientEvent.TICK);
    }

    onWindowResize(): void {
        this.gameGraphicsService.calculateDimensions();
    }

    setOwnPlayerId(playerId: string): void {
        this.playerService.setOwnPlayerId(playerId);
    }

    getStats(): PlayerStats[] {
        return this.playerService.getSortedPlayers()
            .map(player => {
                let tank;
                if (player.tankId !== null) {
                    tank = this.registry.getEntityById(player.tankId);
                }

                let team;
                if (player.teamId !== null) {
                    team = this.teamService.getTeam(player.teamId);
                }

                let tier;
                if (tank) {
                    tier = tank.subtypes[0];
                } else {
                    tier = player.requestedTankTier;
                }

                return {
                    player,
                    team,
                    tier,
                };
            });
    }

    getTeams(): Team[] | undefined {
        const teams = this.teamService.getTeams();
        if (teams === undefined) {
            return [];
        }

        return Array.from(teams);
    }

    getOwnPlayer(): Player | undefined {
        return this.playerService.getOwnPlayer();
    }

    onRoundTimeUpdated(roundSeconds: number): void {
        this.timeService.setRoundTime(roundSeconds);
    }
}
