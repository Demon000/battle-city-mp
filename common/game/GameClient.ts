import GameObject from '../object/GameObject';
import GameObjectRepository from '../object/GameObjectRepository';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
import BoundingBox from '../physics/bounding-box/BoundingBox';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import CollisionService from '../physics/collisions/CollisionService';
import Player from '../player/Player';
import PlayerRepository from '../player/PlayerRepository';
import PlayerService from '../player/PlayerService';
import Tank from '../tank/Tank';

export default class GameClient {
    private playerRepository;
    private playerService;
    private gameObjectRepository;
    private gameObjectService;
    private boundingBoxRepository;
    private collisionService;

    constructor() {
        this.gameObjectRepository = new GameObjectRepository();
        this.boundingBoxRepository = new BoundingBoxRepository();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);

        this.playerRepository = new PlayerRepository();
        this.playerService = new PlayerService(this.playerRepository);

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED, this.onObjectBoundingBoxChanged, this);
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REGISTERED, this.onObjectRegistered, this);
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_UNREGISTERED, this.onObjectUnregistered, this);
    }

    onObjectChangedOnServer(object: GameObject): void {
        this.gameObjectService.updateObject(object);
    }

    onObjectBoundingBoxChanged(objectId: number): void {
        this.collisionService.updateObjectCollisions(objectId);
    }

    onObjectsRegisteredOnServer(objects: GameObject[]): void {
        this.gameObjectService.registerObjects(objects);
    }

    onObjectRegisteredOnServer(object: GameObject): void {
        this.gameObjectService.registerObject(object);
    }

    onObjectUnregisteredOnServer(objectId: number): void {
        this.gameObjectService.unregisterObject(objectId);
    }

    onObjectRegistered(object: GameObject): void {
        this.collisionService.registerObjectCollisions(object.id);
    }

    onObjectUnregistered(objectId: number): void {
        this.collisionService.unregisterObjectCollisions(objectId);
    }

    onPlayersAddedOnServer(players: Player[]): void {
        this.playerService.addPlayers(players);
    }

    onPlayerAddedOnServer(player: Player): void {
        this.playerService.addPlayer(player);
    }

    onPlayerChangedOnService(player: Player): void {
        this.playerService.updatePlayer(player);
    }

    onPlayerRemovedOnServer(playerId: string): void {
        this.playerService.removePlayer(playerId);
    }

    getPlayerTank(playerId: string): Tank | undefined {
        const tankId = this.playerService.getPlayerTankId(playerId);
        if (tankId === undefined) {
            return undefined;
        }

        return this.gameObjectService.getObject(tankId) as Tank;
    }

    getObjectsInBoundingBox(box: BoundingBox): GameObject[] {
        const objectIds = this.collisionService.getOverlappingObjects(box);
        return this.gameObjectService.getMultipleObjects(objectIds);
    }
}