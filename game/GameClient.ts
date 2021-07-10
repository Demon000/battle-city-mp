import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { GameAudioService } from '@/renderer/GameAudioService';
import { GameCamera } from '@/renderer/GameCamera';
import { GameGraphicsService } from '@/renderer/GameGraphicsService';
import { MapRepository } from '@/utils/MapRepository';
import { Ticker, TickerEvent } from '@/utils/Ticker';
import { GameObject, GameObjectOptions, PartialGameObjectOptions } from '../object/GameObject';
import { GameObjectService, GameObjectServiceEvent } from '../object/GameObjectService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { CollisionService } from '../physics/collisions/CollisionService';
import { Player, PartialPlayerOptions, PlayerOptions, PlayerSpawnStatus } from '../player/Player';
import { PlayerService, PlayerServiceEvent } from '../player/PlayerService';
import { GameMapEditorService } from '@/maps/GameMapEditorService';
import { GameObjectType } from '@/object/GameObjectType';
import { Point } from '@/physics/point/Point';
import { GameServerStatus } from './GameServerStatus';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import EventEmitter from 'eventemitter3';
import { Team } from '@/team/Team';
import { TeamService, TeamServiceEvent } from '@/team/TeamService';
import { PlayerStats } from '@/player/PlayerStats';
import { TankService, TankServiceEvent } from '@/tank/TankService';
import { LazyIterable } from '@/utils/LazyIterable';
import { GameObjectAudioRendererFactory } from '@/object/GameObjectAudioRendererFactory';
import { TankTier } from '@/tank/TankTier';
import { Color } from '@/drawable/Color';
import { PartialTankOptions, TankProperties } from '@/tank/Tank';
import { Config } from '@/config/Config';
import { TimeService, TimeServiceEvent } from '@/time/TimeService';

export enum GameClientEvent {
    PLAYERS_CHANGED = 'players-changed',
    TEAMS_CHANGED = 'teams-changed',
    MAP_EDITOR_ENABLED_CHANGED = 'map-editor-enabled-changed',
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
    [GameClientEvent.MAP_EDITOR_ENABLED_CHANGED]: (enabled: boolean) => void;
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
    private gameObjectFactory;
    private playerRepository;
    private playerService;
    private teamRepository;
    private teamService;
    private gameObjectRepository;
    private gameObjectService;
    private tankService;
    private boundingBoxRepository;
    private collisionService;
    private gameCamera;
    private gameGraphicsService;
    private audioRendererFactory;
    private gameAudioService;
    private gameMapEditorService;
    private timeService;
    emitter;
    ticker;

    constructor(canvases: HTMLCanvasElement[]) {
        this.config = new Config();
        this.gameObjectFactory = new GameObjectFactory(this.config);
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.tankService = new TankService(this.gameObjectRepository, this.gameObjectFactory);
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.config, this.playerRepository);
        this.teamRepository = new MapRepository<string, Team>();
        this.teamService = new TeamService(this.teamRepository);
        this.gameCamera = new GameCamera();
        this.gameGraphicsService = new GameGraphicsService(canvases);
        this.audioRendererFactory = new GameObjectAudioRendererFactory();
        this.gameAudioService = new GameAudioService(this.audioRendererFactory);
        this.gameMapEditorService = new GameMapEditorService(this.gameObjectFactory);
        this.timeService = new TimeService(this.config);
        this.emitter = new EventEmitter<GameClientEvents>();
        this.ticker = new Ticker();

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED,
            (objectId: number, box: BoundingBox) => {
                this.collisionService.updateObjectCollisions(objectId, box);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BEFORE_UNREGISTER,
            (objectId: number) => {
                const object = this.gameObjectService.getObject(objectId);
                this.gameAudioService.stopAudioPlayback(object);
            });

        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_ADDED, () => {
            this.emitter.emit(GameClientEvent.OWN_PLAYER_ADDED);
        });
        this.playerService.emitter.on(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_ID,
            (tankId: number | null) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID, tankId);
                this.tankService.setOwnPlayerTankId(tankId);
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

        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
            (maxHealth: number) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                    maxHealth);
            });
        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
            (health: number) => {
                this.emitter.emit(GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                    health);
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

        const object = this.gameObjectService.getObject(objectId);
        switch (object.type) {
            case GameObjectType.TANK:
                this.tankService.updateTank(objectId, objectOptions as PartialTankOptions);
        }
    }

    onObjectRegistered(objectOptions: GameObjectOptions): void {
        const object = this.gameObjectFactory.buildFromOptions(objectOptions);
        this.gameObjectService.registerObject(object);
        this.collisionService.registerObjectCollisions(object.id);
    }

    onObjectUnregistered(objectId: number): void {
        this.gameObjectService.unregisterObject(objectId);
        this.collisionService.unregisterObjectCollisions(objectId);
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
        const configsData = serverStatus.configsData;
        this.config.setMultiple(configsData);

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

        this.gameObjectService.clear();
        const objects =
            LazyIterable.from(serverStatus.objectsOptions)
                .map(o => this.gameObjectFactory.buildFromOptions(o));
        this.gameObjectService.registerObjects(objects);

        this.collisionService.clear();
        const objectIds = objects.map(o => o.id);
        this.collisionService.registerObjectsCollisions(objectIds);

        const visibleGameSize = this.config.get<number>('game-client', 'visibleGameSize');
        this.gameGraphicsService.setTargetGameSize(visibleGameSize);

        this.gameAudioService.clear();
        this.gameAudioService.setMaxAudibleDistance(visibleGameSize);
    }

    onTick(): void {
        const ownPlayer = this.playerService.getOwnPlayer();
        if (ownPlayer === undefined) {
            return;
        }

        if (ownPlayer.tankId !== null) {
            const tank = this.gameObjectService.findObject(ownPlayer.tankId);
            if (tank !== undefined) {
                this.gameCamera.setPosition(tank.centerPosition);
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

        const viewableObjectIds = this.collisionService.getOverlappingObjects(box);
        const viewableObjects = this.gameObjectService.getMultipleObjects(viewableObjectIds);
        this.gameGraphicsService.initializeRender(position);
        this.gameGraphicsService.renderObjectsOver(viewableObjects);
        this.gameAudioService.playObjectsAudioEffect(viewableObjects, position, box);

        if (this.gameMapEditorService.getEnabled()) {
            const gridSize = this.gameMapEditorService.getGridSize();
            if (gridSize !== 0) {
                this.gameGraphicsService.renderGrid(gridSize);
            }

            this.gameMapEditorService.setViewPosition(box.tl);
            const ghostObjects = this.gameMapEditorService.getGhostObjects();
            if (ghostObjects.length !== 0) {
                this.gameGraphicsService.renderObjectsOver(ghostObjects);
            }
        }

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
                    tank = this.tankService.getTank(player.tankId);
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

    setMapEditorEnabled(enabled: boolean): void {
        this.gameMapEditorService.setEnabled(enabled);
        this.gameGraphicsService.setShowInvisible(enabled);
        this.emitter.emit(GameClientEvent.MAP_EDITOR_ENABLED_CHANGED, enabled);
    }

    toggleMapEditorEnabled(): boolean {
        const enabled = !this.gameMapEditorService.getEnabled();
        this.setMapEditorEnabled(enabled);
        return enabled;
    }

    setMapEditorGridSize(gridSize: number): void {
        this.gameMapEditorService.setGridSize(gridSize);
    }

    setMapEditorSelectedObjectType(type: GameObjectType): void {
        this.gameMapEditorService.setSelectedObjectType(type);
    }

    setMapEditorHoverPosition(position: Point): void {
        const worldPosition = this.gameGraphicsService.getWorldPosition(position);
        this.gameMapEditorService.setHoverPosition(worldPosition);
    }

    getMapEditorObjectsOptions(): GameObjectOptions[] {
        const objects = this.gameMapEditorService.getGhostObjects();
        const objectsOptions = objects
            .map(o => o.toSaveOptions()) as GameObjectOptions[];
        return objectsOptions;
    }

    getMapEditorDestroyBox(position: Point): BoundingBox | undefined {
        const worldPosition = this.gameGraphicsService.getWorldPosition(position);
        const destroyBox = this.gameMapEditorService.getDestroyBox(worldPosition);
        if (destroyBox === undefined) {
            return undefined;
        }

        return destroyBox;
    }

    onRoundTimeUpdated(roundSeconds: number): void {
        this.timeService.setRoundTime(roundSeconds);
    }

    getTankProperties(): TankProperties {
        return this.config.get('game-object-properties', GameObjectType.TANK);
    }

    scaleTargetGameSize(scale: number): void {
        this.gameGraphicsService.scaleTargetGameSize(scale);
    }
}
