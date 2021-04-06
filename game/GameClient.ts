import { CLIENT_CONFIG_VISIBLE_GAME_SIZE } from '@/config';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
// import GameAudioService from '@/renderer/GameAudioService';
import GameCamera from '@/renderer/GameCamera';
import GameObjectSpriteMatcher from '@/object/GameObjectSpriteMatcher';
import GameRenderService from '@/renderer/GameRenderService';
import MapRepository from '@/utils/MapRepository';
import Ticker, { TickerEvent } from '@/utils/Ticker';
import GameObject, { PartialGameObjectOptions } from '../object/GameObject';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
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
    private gameCamera;
    private spriteMatcherRepository;
    private gameRenderService;
    // private gameAudioService;
    ticker;

    constructor(canvas: HTMLCanvasElement) {
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.gameCamera = new GameCamera();
        this.spriteMatcherRepository = new MapRepository<number, GameObjectSpriteMatcher>();
        this.gameRenderService = new GameRenderService(this.spriteMatcherRepository, canvas, CLIENT_CONFIG_VISIBLE_GAME_SIZE);
        // this.gameAudioService = new GameAudioService();
        this.ticker = new Ticker();

        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED,
            (objectId: number, box: BoundingBox) => {
                this.collisionService.updateObjectCollisions(objectId, box);
            });

        this.ticker.emitter.on(TickerEvent.TICK, this.onTick, this);
    }

    onObjectChangedOnServer(objectId: number, objectOptions: PartialGameObjectOptions): void {
        this.gameObjectService.updateObject(objectId, objectOptions);
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
        this.gameRenderService.removeRenderer(objectId);
    }

    onPlayersAddedOnServer(players: Player[]): void {
        this.playerService.addPlayers(players);
    }

    onPlayerAddedOnServer(player: Player): void {
        this.playerService.addPlayer(player);
    }

    onPlayerChangedOnServer(player: Player): void {
        this.playerService.updatePlayer(player);
    }

    onPlayerRemovedOnServer(playerId: string): void {
        this.playerService.removePlayer(playerId);
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

        const box = this.gameRenderService.getViewableMapBoundingBox(position);
        if (box === undefined) {
            return;
        }

        const viewableObjectIds = this.collisionService.getOverlappingObjects(box);
        const viewableObjects = this.gameObjectService.getMultipleObjects(viewableObjectIds);
        this.gameRenderService.renderObjects(viewableObjects, position);
        // this.gameAudioService.playObjectSounds(viewableObjects, position);
    }

    onWindowResize(): void {
        this.gameRenderService.calculateDimensions();
    }

    clear(): void {
        this.gameObjectRepository.clear();
        this.boundingBoxRepository.clear();
    }
}
