import MapRepository from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { Direction } from 'node:readline';
import now from 'performance-now';
import Action, { ActionOptions, ActionType } from '../actions/Action';
import ButtonPressAction from '../actions/ButtonPressAction';
import GameMapService, { GameMapServiceEvent } from '../maps/GameMapService';
import GameObject from '../object/GameObject';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import { rules } from '../physics/collisions/CollisionRules';
import CollisionService, { CollisionServiceEvent } from '../physics/collisions/CollisionService';
import { CollisionEventType } from '../physics/collisions/ICollisionRule';
import Point from '../physics/point/Point';
import Player, { PlayerSpawnStatus } from '../player/Player';
import PlayerService, { PlayerServiceEvent } from '../player/PlayerService';
import TankService, { TankServiceEvent } from '../tank/TankService';
import { GameEvent } from './GameEvent';

export default class GameServer {
    private gameMapService;
    private tankService;
    private playerRepository;
    private playerService;
    private gameObjectRepository;
    private gameObjectService;
    private boundingBoxRepository;
    private collisionRules;
    private collisionService;

    emitter = new EventEmitter();

    constructor() {
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository();
        this.collisionRules = rules;
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository, this.collisionRules);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.gameMapService = new GameMapService();
        this.tankService = new TankService();
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);

        this.collisionService.emitter.on(CollisionEventType.BULLET_HIT_WALL, this.onBulletWillHitWall, this);
        this.collisionService.emitter.on(CollisionEventType.BULLET_HIT_TANK, this.onBulletWillHitTank, this);
        this.collisionService.emitter.on(CollisionEventType.BULLET_HIT_BULLET, this.onBulletWillHitBullet, this);

        this.gameMapService.emitter.on(GameMapServiceEvent.OBJECTS_SPAWNED, this.onObjectsSpawned, this);

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_ADDED, this.onPlayerAdded, this);
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REMOVED, this.onPlayerRemoved, this);

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_SHOOTING, this.onPlayerShooting, this);
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_MOVING, this.onPlayerMoving, this);
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_NOT_MOVING, this.onPlayerNotMoving, this);

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REQUESTED_DIRECTION, this.onObjectRequestedDirection, this);
        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED, this.onObjectDirectionAllowed, this);
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REQUESTED_POSITION, this.onObjectRequestedPosition, this);
        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_MOVE_ALLOWED, this.onObjectPositionAllowed, this);

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED, this.onObjectBoundingBoxChanged, this);
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REGISTERED, this.onObjectRegistered, this);
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_UNREGISTERED, this.onObjectUnregistered, this);

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_SPAWN_TANK_REQUESTED, this.onPlayerSpawnTankRequested, this);
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_DESPAWN_TANK_REQUESTED, this.onPlayerDespawnTankRequested, this);
        this.tankService.emitter.on(TankServiceEvent.PLAYER_TANK_CHANGED, this.onPlayerTankChanged, this);
        this.tankService.emitter.on(TankServiceEvent.TANK_SPAWNED, this.onObjectSpawned, this);
        this.tankService.emitter.on(TankServiceEvent.TANK_DESPAWNED, this.onObjectDespawned, this);

        this.gameMapService.loadFromFile('./maps/simple.json');
    }

    getGameObjects(): GameObject[] {
        return this.gameObjectService.getObjects();
    }

    getPlayers(): Player[] {
        return this.playerService.getPlayers();
    }
    
    onBulletWillHitWall(movingObjectId: number, position: Point, staticObjectId: number): void {
        console.log('Bullet hit wall');
    }

    onBulletWillHitTank(movingObjectId: number, position: Point, staticObjectId: number): void {
        console.log('Bullet hit tank');
    }

    onBulletWillHitBullet(movingObjectId: number, position: Point, staticObjectId: number): void {
        console.log('Bullet hit bullet');
    }

    onPlayerMoving(playerId: string, direction: Direction): void {
        const tankId = this.playerService.getPlayerTankId(playerId);
        if (tankId === undefined) {
            return;
        }

        this.gameObjectService.processObjectDirection(tankId, direction);
        this.gameObjectService.setObjectMoving(tankId, true);
    }

    onPlayerNotMoving(playerId: string): void {
        const tankId = this.playerService.getPlayerTankId(playerId);
        if (tankId === undefined) {
            return;
        }

        this.gameObjectService.setObjectMoving(tankId, false);
    }

    onObjectRequestedDirection(objectId: number, direction: Direction): void {
        this.gameObjectService.setObjectRequestedDirection(objectId, direction);
        this.collisionService.validateObjectDirection(objectId, direction);
    }

    onObjectDirectionAllowed(objectId: number, direction: Direction): void {
        this.gameObjectService.setObjectDirection(objectId, direction);
    }

    onObjectRequestedPosition(objectId: number, position: Point): void {
        this.collisionService.validateObjectMovement(objectId, position);
    }

    onObjectPositionAllowed(objectId: number, position: Point): void {
        this.gameObjectService.setObjectPosition(objectId, position);
    }

    onObjectBoundingBoxChanged(objectId: number): void {
        this.collisionService.updateObjectCollisions(objectId);
    }

    onObjectChanged(object: GameObject): void {
        this.emitter.emit(GameEvent.OBJECT_CHANGED, object);
    }

    onObjectsSpawned(objects: GameObject[]): void {
        this.gameObjectService.registerObjects(objects);
    }

    onObjectSpawned(object: GameObject): void {
        this.gameObjectService.registerObject(object);
    }

    onObjectRegistered(object: GameObject): void {
        this.collisionService.registerObjectCollisions(object.id);
        this.emitter.emit(GameEvent.OBJECT_REGISTERED, object);
    }

    onObjectDespawned(objectId: number): void {
        this.gameObjectService.unregisterObject(objectId);
    }

    onObjectUnregistered(objectId: number): void {
        this.collisionService.unregisterObjectCollisions(objectId);
        this.emitter.emit(GameEvent.OBJECT_UNREGISTERED, objectId);
    }

    onPlayerShooting(playerId: string): void {
        // const tank = this.tankService.getPlayerTank(player);
        // spawn bullet using tank position
        console.log('player shooting ' + playerId);
    }

    onPlayerAdded(player: Player): void {
        this.emitter.emit(GameEvent.PLAYER_ADDED, player);
    }

    onPlayerChanged(player: Player): void {
        this.emitter.emit(GameEvent.PLAYER_CHANGED, player);        
    }

    onPlayerRemoved(playerId: string): void {
        this.emitter.emit(GameEvent.PLAYER_REMOVED, playerId);
    }

    onPlayerActionFromClient(playerId: string, data: ActionOptions): void {
        const action = new Action(data);
        if (action.type === ActionType.BUTTON_PRESS) {
            this.playerService.addPlayerButtonPressAction(playerId, action as ButtonPressAction);
        }
    }

    onPlayerConnectedFromClient(playerId: string): void {
        this.playerService.createPlayer(playerId);
        this.playerService.requestPlayerSpawnStatus(playerId, PlayerSpawnStatus.SPAWN);
    }

    onPlayerDisconnectedFromClient(playerId: string): void {
        this.playerService.requestPlayerSpawnStatus(playerId, PlayerSpawnStatus.DESPAWN);
        this.playerService.requestPlayerDisconnect(playerId);
    }

    onPlayerSpawnTankRequested(playerId: string): void {
        const spawnPosition = this.gameObjectService.getRandomSpawnPosition();
        this.tankService.spawnPlayerTank(playerId, spawnPosition);
    }

    onPlayerDespawnTankRequested(playerId: string, tankId: number): void {
        this.tankService.despawnPlayerTank(playerId, tankId);
    }

    onPlayerTankChanged(playerId: string, tankId: number): void {
        this.playerService.setPlayerTankId(playerId, tankId);
    }

    update(): void {
        this.playerService.processPlayerActions();
        this.gameObjectService.processObjectsMovement(this.deltaSeconds);
    }

    tickRate = 128;
    tickTime = 1000 / this.tickRate;
    lastTickTime = 0;
    deltaSeconds = 0;
    running = true;
    tick(): void {
        const currentTickTime = now();
        if (this.lastTickTime) {
            this.deltaSeconds = (currentTickTime - this.lastTickTime) / 1000;
            this.update();
        }

        if (!this.running) {
            return;
        }

        setTimeout(this.tick.bind(this), this.tickTime);
    }

    start(): void {
        this.running = true;

        this.tick();
    }

    stop(): void {
        this.running = false;
    }
}
