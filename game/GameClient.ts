import { CLIENT_CONFIG_FPS, CLIENT_CONFIG_VISIBLE_GAME_SIZE } from '@/config';
import GameRenderService from '@/renderer/GameRenderService';
import MapRepository from '@/utils/MapRepository';
import Ticker, { TickerEvent } from '@/utils/Ticker';
import GameObject from '../object/GameObject';
import GameObjectService from '../object/GameObjectService';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import CollisionService from '../physics/collisions/CollisionService';
import Player from '../player/Player';
import PlayerService from '../player/PlayerService';

export default class GameClient {
    private playerRepository;
    private playerService;
    private gameObjectRepository;
    private gameObjectService;
    private boundingBoxRepository;
    private collisionService;
    private gameRenderService;
    ticker;

    constructor(canvas: HTMLCanvasElement) {
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.gameRenderService = new GameRenderService(canvas, CLIENT_CONFIG_VISIBLE_GAME_SIZE);
        this.ticker = new Ticker(CLIENT_CONFIG_FPS);

        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);

        this.ticker.emitter.on(TickerEvent.TICK, this.onTick, this);
    }

    onObjectChangedOnServer(object: GameObject): void {
        this.gameObjectService.updateObject(object);
        this.collisionService.updateObjectCollisions(object.id);
    }

    onObjectsRegisteredOnServer(objects: GameObject[]): void {
        this.gameObjectService.registerObjects(objects);
        const objectIds = objects.map(o => o.id);
        this.collisionService.registerObjectsCollisions(objectIds);
    }

    onObjectRegisteredOnServer(object: GameObject): void {
        this.gameObjectService.registerObject(object);
        this.collisionService.registerObjectCollisions(object.id);
    }

    onObjectUnregisteredOnServer(objectId: number): void {
        this.gameObjectService.unregisterObject(objectId);
        this.collisionService.unregisterObjectCollisions(objectId);
    }

    onPlayersAddedOnServer(players: Player[]): void {
        this.playerService.addPlayers(players);
    }

    onPlayerAddedOnServer(player: Player): void {
        this.playerService.addPlayer(player);
    }

    onPlayerChangedOnServer(player: Player): void {
        this.playerService.updatePlayer(player);
        let watchedObject = undefined;
        if (player.tankId !== undefined) {
            watchedObject = this.gameObjectService.getObject(player.tankId);
        }
        this.gameRenderService.setWatchedObject(watchedObject);
    }

    onPlayerRemovedOnServer(playerId: string): void {
        this.playerService.removePlayer(playerId);
    }

    onTick(): void {
        const box = this.gameRenderService.getViewableMapBoundingBox();
        if (box === undefined) {
            return;
        }

        const viewableObjectIds = this.collisionService.getOverlappingObjects(box);
        const viewableObjects = this.gameObjectService.getMultipleObjects(viewableObjectIds);
        this.gameRenderService.renderObjects(viewableObjects);
    }
}
