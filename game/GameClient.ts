import MapRepository from '@/utils/MapRepository';
import GameObject from '../object/GameObject';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
import BoundingBox from '../physics/bounding-box/BoundingBox';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import CollisionService from '../physics/collisions/CollisionService';
import Player from '../player/Player';
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
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository();
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);

        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);

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
        this.collisionService.registerObjectCollisions(objectId);
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

    registerObjects(objects: GameObject[]): void {
        this.gameObjectService.registerObjects(objects);
    }

    addPlayers(players: Player[]): void {
        this.playerService.addPlayers(players);
    }
}
