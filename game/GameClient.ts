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
import GameObjectAudioRenderer from '@/object/GameObjectAudioRenderer';
import GameMapEditorService from '@/maps/GameMapEditorService';
import { GameObjectType } from '@/object/GameObjectType';
import Point from '@/physics/point/Point';
import { GameServerStatus } from './GameServerStatus';
import GameObjectFactory from '@/object/GameObjectFactory';
import EventEmitter from 'eventemitter3';

export enum GameClientEvent {
    PLAYERS_CHANGED = 'players-changed',
}

export interface GameClientEvents {
    [GameClientEvent.PLAYERS_CHANGED]: () => void;
}

export default class GameClient {
    private playerRepository;
    private playerService;
    private gameObjectRepository;
    private gameObjectService;
    private boundingBoxRepository;
    private collisionService;
    private gameCamera;
    private gameGraphicsService;
    private objectAudioRendererRepository;
    private gameAudioService;
    private gameMapEditorService;
    emitter;
    ticker;

    constructor(canvases: HTMLCanvasElement[]) {
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);
        this.gameCamera = new GameCamera();
        this.gameGraphicsService = new GameGraphicsService(canvases, CLIENT_CONFIG_VISIBLE_GAME_SIZE);
        this.objectAudioRendererRepository = new MapRepository<number, GameObjectAudioRenderer>();
        this.gameAudioService = new GameAudioService(this.objectAudioRendererRepository);
        this.gameMapEditorService = new GameMapEditorService();
        this.emitter = new EventEmitter<GameClientEvents>();
        this.ticker = new Ticker();

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED,
            (objectId: number, box: BoundingBox) => {
                this.collisionService.updateObjectCollisions(objectId, box);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYERS_CHANGED,
            () => {
                this.emitter.emit(GameClientEvent.PLAYERS_CHANGED);
            });

        this.ticker.emitter.on(TickerEvent.TICK, this.onTick, this);
    }

    onObjectChanged(objectId: number, objectOptions: PartialGameObjectOptions): void {
        this.gameObjectService.updateObject(objectId, objectOptions);
    }

    onObjectRegistered(objectOptions: GameObjectOptions): void {
        const object = GameObjectFactory.buildFromOptions(objectOptions);
        this.gameObjectService.registerObject(object);
        this.collisionService.registerObjectCollisions(object.id);
    }

    onObjectUnregistered(objectId: number): void {
        this.gameObjectService.unregisterObject(objectId);
        this.collisionService.unregisterObjectCollisions(objectId);
        this.gameAudioService.removeObjectAudioRenderer(objectId);
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

    onServerStatus(serverStatus: GameServerStatus): void {
        this.clear();
        const players = serverStatus.playersOptions.map(o => new Player(o));
        this.playerService.addPlayers(players);

        const objects = serverStatus.objectsOptions.map(o => GameObjectFactory.buildFromOptions(o));
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

        const gridSize = this.gameMapEditorService.getGridSize();
        if (gridSize !== 0) {
            this.gameGraphicsService.renderGrid(gridSize);
        }

        this.gameMapEditorService.setViewPosition(box.tl);
        this.gameMapEditorService.updateGhostObjects();
        const ghostObjects = this.gameMapEditorService.getGhostObjects();
        if (ghostObjects.length !== 0) {
            this.gameGraphicsService.renderObjectsOver(ghostObjects);
        }
    }

    onWindowResize(): void {
        this.gameGraphicsService.calculateDimensions();
    }

    setOwnPlayerId(playerId: string): void {
        this.playerService.setOwnPlayerId(playerId);
    }

    getPlayers(): Player[] {
        return this.playerService.getPlayersStats();
    }

    getOwnPlayer(): Player | undefined {
        return this.playerService.getOwnPlayer();
    }

    setMapEditorEnabled(enabled: boolean): void {
        this.gameMapEditorService.setEnabled(enabled);
        this.gameGraphicsService.setShowInvisible(enabled);
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
        this.gameObjectRepository.clear();
        this.boundingBoxRepository.clear();
        this.gameAudioService.clear();
    }
}
