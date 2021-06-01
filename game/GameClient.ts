import { CLIENT_CONFIG_VISIBLE_GAME_SIZE } from '@/config';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import GameAudioService from '@/renderer/GameAudioService';
import GameCamera from '@/renderer/GameCamera';
import GameGraphicsService from '@/renderer/GameGraphicsService';
import MapRepository from '@/utils/MapRepository';
import Ticker, { TickerEvent } from '@/utils/Ticker';
import GameObject, { GameObjectOptions, PartialGameObjectOptions } from '../object/GameObject';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import CollisionService from '../physics/collisions/CollisionService';
import Player, { PartialPlayerOptions, PlayerOptions } from '../player/Player';
import PlayerService, { PlayerServiceEvent } from '../player/PlayerService';
import GameMapEditorService from '@/maps/GameMapEditorService';
import { GameObjectType } from '@/object/GameObjectType';
import Point from '@/physics/point/Point';
import { GameServerStatus } from './GameServerStatus';
import GameObjectFactory from '@/object/GameObjectFactory';
import EventEmitter from 'eventemitter3';
import Team from '@/team/Team';
import TeamService, { TeamServiceEvent } from '@/team/TeamService';
import PlayerStats from '@/player/PlayerStats';
import TankService, { TankServiceEvent } from '@/tank/TankService';
import LazyIterable from '@/utils/LazyIterable';
import GameObjectAudioRendererFactory from '@/object/GameObjectAudioRendererFactory';
import { TankTier } from '@/tank/TankTier';
import { Color } from '@/drawable/Color';
import { PartialTankOptions } from '@/tank/Tank';

export enum GameClientEvent {
    PLAYERS_CHANGED = 'players-changed',
    TEAMS_CHANGED = 'teams-changed',
    MAP_EDITOR_ENABLED_CHANGED = 'map-editor-enabled-changed',

    OWN_PLAYER_ADDED = 'own-player-added',
    OWN_PLAYER_CHANGED_TANK_ID = 'own-player-changed-tank-id',
    OWN_PLAYER_CHANGED_TEAM_ID = 'own-player-changed-team-id',
    OWN_PLAYER_CHANGED_TANK_TIER = 'own-player-changed-tank-tier',
    OWN_PLAYER_CHANGED_TANK_COLOR = 'own-player-changed-tank-color',

    OWN_PLAYER_TANK_CHANGED_MAX_HEALTH = 'own-player-tank-changed-max-health',
    OWN_PLAYER_TANK_CHANGED_HEALTH = 'own-player-tank-changed-health',
    OWN_PLAYER_TANK_CHANGED_MAX_BULLETS = 'own-player-tank-changed-max-bullets',
    OWN_PLAYER_TANK_CHANGED_BULLETS = 'own-player-tank-changed-bullets',
}

export interface GameClientEvents {
    [GameClientEvent.PLAYERS_CHANGED]: () => void;
    [GameClientEvent.TEAMS_CHANGED]: () => void,
    [GameClientEvent.MAP_EDITOR_ENABLED_CHANGED]: (enabled: boolean) => void;

    [GameClientEvent.OWN_PLAYER_ADDED]: () => void,
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID]: (tankId: number | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID]: (teamId: string | null) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER]: (tier: TankTier) => void;
    [GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR]: (color: Color) => void;

    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH]: (maxHealth: number) => void,
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH]: (health: number) => void,
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS]: (maxBullets: number) => void,
    [GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS]: (bullets: number) => void,
}

export default class GameClient {
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
    emitter;
    ticker;

    constructor(canvases: HTMLCanvasElement[]) {
        this.gameObjectFactory = new GameObjectFactory();
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.tankService = new TankService(this.gameObjectRepository);
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);
        this.teamRepository = new MapRepository<string, Team>();
        this.teamService = new TeamService(this.teamRepository);
        this.gameCamera = new GameCamera();
        this.gameGraphicsService = new GameGraphicsService(canvases, CLIENT_CONFIG_VISIBLE_GAME_SIZE);
        this.audioRendererFactory = new GameObjectAudioRendererFactory();
        this.gameAudioService = new GameAudioService(this.audioRendererFactory);
        this.gameMapEditorService = new GameMapEditorService(this.gameObjectFactory);
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

        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
            (maxHealth: number) => {
                console.log(maxHealth);
                this.emitter.emit(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
                    maxHealth);
            });
        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
            (health: number) => {
                console.log(health);
                this.emitter.emit(GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
                    health);
            });
        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
            (maxBullets: number) => {
                console.log(maxBullets);
                this.emitter.emit(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
                    maxBullets);
            });
        this.tankService.emitter.on(TankServiceEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
            (bullets: number) => {
                console.log(bullets);
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
        this.clear();
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

        const objects =
            LazyIterable.from(serverStatus.objectsOptions)
                .map(o => this.gameObjectFactory.buildFromOptions(o));
        this.gameObjectService.registerObjects(objects);

        const objectIds = objects.map(o => o.id);
        this.collisionService.registerObjectsCollisions(objectIds);
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
    }

    onWindowResize(): void {
        this.gameGraphicsService.calculateDimensions();
    }

    setOwnPlayerId(playerId: string): void {
        this.playerService.setOwnPlayerId(playerId);
    }

    getPlayersStats(): PlayerStats[] {
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

    clear(): void {
        this.playerService.clear();
        this.teamService.clear();
        this.gameObjectRepository.clear();
        this.boundingBoxRepository.clear();
        this.gameAudioService.clear();
    }
}
