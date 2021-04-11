import { CLIENT_CONFIG_VISIBLE_GAME_SIZE } from '@/config';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import GameAudioService from '@/renderer/GameAudioService';
import GameCamera from '@/renderer/GameCamera';
import GameObjectGraphicsRenderer from '@/object/GameObjectGraphicsRenderer';
import GameGraphicsService from '@/renderer/GameGraphicsService';
import MapRepository from '@/utils/MapRepository';
import Ticker, { TickerEvent } from '@/utils/Ticker';
import GameObject, { PartialGameObjectOptions } from '../object/GameObject';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import CollisionService from '../physics/collisions/CollisionService';
import Player from '../player/Player';
import PlayerService from '../player/PlayerService';
import GameObjectAudioRenderer from '@/object/GameObjectAudioRenderer';

export default class GameClient {
    private playerRepository;
    private playerService;
    private gameObjectRepository;
    private gameObjectService;
    private boundingBoxRepository;
    private collisionService;
    private gameCamera;
    private objectGraphicsRendererRepository;
    private gameGraphicsService;
    private objectAudioRendererRepository;
    private gameAudioService;
    ticker;

    constructor(canvas: HTMLCanvasElement) {
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.gameCamera = new GameCamera();
        this.objectGraphicsRendererRepository = new MapRepository<number, GameObjectGraphicsRenderer>();
        this.gameGraphicsService = new GameGraphicsService(this.objectGraphicsRendererRepository, canvas, CLIENT_CONFIG_VISIBLE_GAME_SIZE);
        this.objectAudioRendererRepository = new MapRepository<number, GameObjectAudioRenderer>();
        this.gameAudioService = new GameAudioService(this.objectAudioRendererRepository);
        this.ticker = new Ticker();

        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED,
            (objectId: number, box: BoundingBox) => {
                this.collisionService.updateObjectCollisions(objectId, box);
            });

        this.ticker.emitter.on(TickerEvent.TICK, this.onTick, this);
    }

    updateCameraPosition(): void {
        const player = this.playerService.getOwnPlayer();
        if (player === undefined || player.tankId === null) {
            return;
        }

        const tank = this.gameObjectService.findObject(player.tankId);
        if (tank === undefined) {
            return;
        }

        this.gameCamera.setPosition(tank?.position);
    }

    unsetCameraWatchedObject(objectId: number): void {
        if (this.gameCamera.watchedObject?.id === objectId) {
            this.gameCamera.watchedObject = undefined;
        }
    }

    onObjectChangedOnServer(objectId: number, objectOptions: PartialGameObjectOptions): void {
        this.gameObjectService.updateObject(objectId, objectOptions);
        this.updateCameraPosition();
    }

    onObjectsRegisteredOnServer(objects: GameObject[]): void {
        this.gameObjectService.registerObjects(objects);
        const objectIds = objects.map(o => o.id);
        this.collisionService.registerObjectsCollisions(objectIds);
    }

    onObjectRegisteredOnServer(object: GameObject): void {
        this.gameObjectService.registerObject(object);
        this.collisionService.registerObjectCollisions(object.id);
        this.updateCameraPosition();
    }

    onObjectUnregisteredOnServer(objectId: number): void {
        this.gameObjectService.unregisterObject(objectId);
        this.collisionService.unregisterObjectCollisions(objectId);
        this.gameGraphicsService.removeObjectGraphicsRenderer(objectId);
        this.gameAudioService.removeObjectAudioRenderer(objectId);
        this.unsetCameraWatchedObject(objectId);
    }

    onPlayersAddedOnServer(players: Player[]): void {
        this.playerService.addPlayers(players);
    }

    onPlayerAddedOnServer(player: Player): void {
        this.playerService.addPlayer(player);
        this.updateCameraPosition();
    }

    onPlayerChangedOnServer(player: Player): void {
        this.playerService.updatePlayer(player);
        this.updateCameraPosition();
    }

    onPlayerRemovedOnServer(playerId: string): void {
        this.playerService.removePlayer(playerId);
    }

    onTpsSetOnServer(tps: number): void {
        this.gameCamera.setInterpolationTime(1 / tps);
    }

    onTick(): void {
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
        this.gameGraphicsService.renderObjects(viewableObjects, position);
        this.gameAudioService.playObjectsAudioEffect(viewableObjects, position, box);
    }

    onWindowResize(): void {
        this.gameGraphicsService.calculateDimensions();
    }

    clear(): void {
        this.playerService.clear();
        this.gameObjectRepository.clear();
        this.boundingBoxRepository.clear();
        this.gameAudioService.clear();
        this.gameGraphicsService.clear();
    }
}
