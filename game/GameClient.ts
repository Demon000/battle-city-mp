import { GameAudioService } from '@/renderer/GameAudioService';
import { GameCamera } from '@/renderer/GameCamera';
import { GameGraphicsService } from '@/renderer/GameGraphicsService';
import { MapRepository } from '@/utils/MapRepository';
import { Ticker, TickerEvent } from '@/utils/Ticker';
import { GameObject, PartialGameObjectOptions } from '../object/GameObject';
import { GameObjectService } from '../object/GameObjectService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { CollisionService } from '../physics/collisions/CollisionService';
import { Player, PartialPlayerOptions, PlayerOptions, PlayerSpawnStatus } from '../player/Player';
import { PlayerService, PlayerServiceEvent } from '../player/PlayerService';
import { GameObjectType } from '@/object/GameObjectType';
import { GameServerStatus } from './GameServerStatus';
import { GameObjectFactory, GameObjectFactoryBuildOptions } from '@/object/GameObjectFactory';
import EventEmitter from 'eventemitter3';
import { Team } from '@/team/Team';
import { TeamService, TeamServiceEvent } from '@/team/TeamService';
import { PlayerStats } from '@/player/PlayerStats';
import { TankService, TankServiceEvent } from '@/tank/TankService';
import { LazyIterable } from '@/utils/LazyIterable';
import { GameObjectAudioRendererFactory } from '@/object/GameObjectAudioRendererFactory';
import { TankTier } from '@/tank/TankTier';
import { Color } from '@/drawable/Color';
import { PartialTankOptions, Tank, TankProperties } from '@/tank/Tank';
import { Config } from '@/config/Config';
import { TimeService, TimeServiceEvent } from '@/time/TimeService';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { Registry, RegistryComponentEvent, RegistryEvent } from '@/ecs/Registry';
import { ComponentRegistry } from '@/ecs/ComponentRegistry';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';
import { EntityId } from '@/ecs/EntityId';
import { Entity } from '@/ecs/Entity';
import { BoundingBoxComponent } from '@/physics/bounding-box/BoundingBoxComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { HealthComponent } from '@/components/HealthComponent';

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

    CONFIG_CHANGED = 'config-changed',

    TICK = 'tick',
}

export interface GameClientEvents {
    [GameClientEvent.PLAYERS_CHANGED]: () => void;
    [GameClientEvent.TEAMS_CHANGED]: () => void;
    [GameClientEvent.ROUND_TIME_UPDATED]: (roundTimeSeconds: number) => void;
    [GameClientEvent.ROUND_TIME_RESTART]: () => void;
    [GameClientEvent.SCOREBOARD_WATCH_TIME]: (value: boolean) => void;

    [GameClientEvent.OWN_PLAYER_ADDED]: () => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID]: (tankId: number | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID]: (teamId: string | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER]: (tier: TankTier) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR]: (color: Color) => void;

    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH]: (maxHealth: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH]: (health: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS]: (maxBullets: number) => void;
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS]: (bullets: number) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT]: (respawnTimeout: number) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS]: (requestedSpawnStatus: PlayerSpawnStatus) => void;

    [GameClientEvent.CONFIG_CHANGED]: () => void;

    [GameClientEvent.TICK]: () => void;
}

export class GameClient {
    private config;

    private registryIdGenerator;
    private componentRegistry;
    private registry;
    private entityBlueprint;

    private gameObjectFactory;
    private playerRepository;
    private playerService;
    private teamRepository;
    private teamService;
    private gameObjectService;
    private tankService;
    private boundingBoxRepository;
    private collisionService;
    private gameCamera;
    private gameGraphicsService;
    private audioRendererFactory;
    private gameAudioService;
    private timeService;
    emitter;
    ticker;

    constructor(canvases: HTMLCanvasElement[]) {
        this.config = new Config();

        this.registryIdGenerator = new RegistryNumberIdGenerator();
        this.componentRegistry = new ComponentRegistry();
        this.registry = new Registry(this.registryIdGenerator, this.componentRegistry);
        this.entityBlueprint = new EntityBlueprint(this.config, BlueprintEnv.CLIENT);
        this.gameObjectFactory = new GameObjectFactory(this.registry, this.config, this.entityBlueprint);

        this.boundingBoxRepository = new BoundingBoxRepository<number>(this.config);
        this.collisionService = new CollisionService(this.boundingBoxRepository, this.registry);
        this.gameObjectService = new GameObjectService(this.registry);
        this.tankService = new TankService(this.gameObjectFactory, this.registry);
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.config, this.playerRepository);
        this.teamRepository = new MapRepository<string, Team>();
        this.teamService = new TeamService(this.teamRepository);
        this.gameCamera = new GameCamera();
        this.gameGraphicsService = new GameGraphicsService(this.registry, canvases);
        this.audioRendererFactory = new GameObjectAudioRendererFactory();
        this.gameAudioService = new GameAudioService(this.audioRendererFactory);
        this.timeService = new TimeService(this.config);
        this.emitter = new EventEmitter<GameClientEvents>();
        this.ticker = new Ticker();

        this.registry.emitter.on(RegistryComponentEvent.COMPONENT_CHANGED,
            (_event, component) => {
                this.gameGraphicsService.processObjectsGraphicsDependencies(component.entity.id,
                    component.clazz.tag);
            });
        this.registry.componentEmitter(PositionComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component) => {
                    const entity = component.entity;
                    this.collisionService.processObjectDirtyBoundingBox(entity);
                    this.gameObjectService.markDirtyCenterPosition(entity);
                });
        this.registry.componentEmitter(SizeComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component) => {
                    const entity = component.entity;
                    this.collisionService.processObjectDirtyBoundingBox(entity);
                    this.gameObjectService.markDirtyCenterPosition(entity);
                });
        this.registry.componentEmitter(BoundingBoxComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component) => {
                    const entity = component.entity;
                    this.collisionService.processObjectDirtyCollisions(entity);
                });
        this.registry.componentEmitter(MovementComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component) => {
                    const entity = component.entity;
                    this.gameObjectService.markDirtyIsMoving(entity);
                });
        this.registry.componentEmitter(HealthComponent, true)
            .on(RegistryComponentEvent.COMPONENT_CHANGED,
                (_event, component, data) => {
                    const entity = component.entity;
                    if (entity.id === this.tankService.getOwnPlayerTankId()) {
                        if ('value' in data) {
                            this.emitter.emit(
                                GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                                data.value,
                            );
                        }

                        if ('max' in data) {
                            this.emitter.emit(
                                GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                                data.max,
                            );
                        }
                    }
                });

        this.registry.emitter.on(RegistryEvent.ENTITY_BEFORE_DESTROY,
            (entity: Entity) => {
                const object = entity as GameObject;
                this.gameAudioService.stopAudioPlayback(object);
            });

        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_ADDED, () => {
            this.emitter.emit(GameClientEvent.OWN_PLAYER_ADDED);
        });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_ID,
            (tankId: number | null) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID, tankId);
                this.tankService.setOwnPlayerTankId(tankId);
                if (tankId !== null) {
                    const tank = this.registry.getEntityById(tankId);
                    const health = tank.getComponent(HealthComponent);
                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                        health.value,
                    );
                    this.emitter.emit(
                        GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                        health.max,
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

        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
            (maxBullets: number) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
                    maxBullets);
            });
        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
            (bullets: number) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
                    bullets);
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

    onObjectChanged(objectId: number, objectOptions: PartialGameObjectOptions): void {
        this.gameObjectService.updateObject(objectId, objectOptions);

        const object = this.registry.getEntityById(objectId);
        switch (object.type) {
            case GameObjectType.TANK:
                this.tankService.updateTank(objectId, objectOptions as PartialTankOptions);
        }
    }

    onObjectRegistered(buildOptions: GameObjectFactoryBuildOptions): void {
        this.gameObjectFactory.buildFromOptions(buildOptions);
    }

    onObjectUnregistered(entityId: EntityId): void {
        const entity = this.registry.getEntityById(entityId);
        this.gameObjectService.markDestroyed(entity);
    }

    onEntityComponentAdded(entityId: number, tag: string, data: any): void {
        const entity = this.registry.getEntityById(entityId);
        entity.addComponent(tag, data);
    }

    onEntityComponentUpdated(entityId: number, tag: string, data: any): void {
        const entity = this.registry.getEntityById(entityId);
        entity.updateComponent(tag, data);
    }

    onEntityComponentRemoved(entityId: number, tag: string): void {
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

        this.emitter.emit(GameClientEvent.CONFIG_CHANGED);

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

        LazyIterable.from(serverStatus.objectsOptions)
            .forEach(o => this.gameObjectFactory.buildFromOptions(o));

        const visibleGameSize = this.config.get<number>('game-client', 'visibleGameSize');
        this.gameGraphicsService.setTargetGameSize(visibleGameSize);

        this.gameAudioService.clear();
        this.gameAudioService.setMaxAudibleDistance(visibleGameSize);
    }

    onTick(): void {
        this.gameObjectService.processObjectsDirtyIsMoving();
        this.gameObjectService.processObjectsDirtyCenterPosition();
        this.gameObjectService.processObjectsDestroyed();
        this.collisionService.processObjectsIsUnderBush();
        this.gameGraphicsService.processObjectsDirtyGraphics();

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

        const viewableObjectIds = this.collisionService
            .getOverlappingObjects(box);
        const viewableObjects = this.registry
            .getMultipleEntitiesById(viewableObjectIds) as Iterable<GameObject>;
        this.gameGraphicsService.initializeRender(position);
        this.gameGraphicsService.renderObjectsOver(viewableObjects);
        this.gameAudioService.playObjectsAudioEffect(viewableObjects, position, box);

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
                    tank = this.registry.getEntityById(player.tankId) as Tank;
                }

                let team;
                if (player.teamId !== null) {
                    team = this.teamService.getTeam(player.teamId);
                }

                return {
                    player,
                    team,
                    tier: tank?.tier || player.requestedTankTier,
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

    getTankProperties(): TankProperties {
        return this.config.get('game-object-properties', GameObjectType.TANK);
    }
}
