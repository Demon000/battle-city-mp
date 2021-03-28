import BulletService, { BulletServiceEvent } from '@/bullet/BulletService';
import { Direction } from '@/physics/Direction';
import Tank from '@/tank/Tank';
import TankService, { TankServiceEvent } from '@/tank/TankService';
import MapRepository from '@/utils/MapRepository';
import Ticker, { TickerEvent } from '@/utils/Ticker';
import EventEmitter from 'eventemitter3';
import Action, { ActionType } from '../actions/Action';
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
import { GameEvent } from './GameEvent';

export default class GameServer {
    private gameMapService;
    private playerRepository;
    private playerService;
    private gameObjectRepository;
    private gameObjectService;
    private tankService;
    private bulletService;
    private boundingBoxRepository;
    private collisionRules;
    private collisionService;
    ticker;

    emitter = new EventEmitter();

    constructor() {
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>();
        this.collisionRules = rules;
        this.collisionService = new CollisionService(this.gameObjectRepository, this.boundingBoxRepository, this.collisionRules);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.tankService = new TankService(this.gameObjectRepository);
        this.bulletService = new BulletService(this.gameObjectRepository);
        this.gameMapService = new GameMapService();
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);
        this.ticker = new Ticker(128);

        /**
         * GameMapService event handlers
         */
        this.gameMapService.emitter.on(GameMapServiceEvent.OBJECTS_SPAWNED,
            (objects: GameObject[]) => {
                this.gameObjectService.registerObjects(objects);
            });

        /**
         * PlayerService event handlers
         */
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_GAME_OBJECTS,
            (playerId: string) => {
                const objects = this.gameObjectService.getObjects();
                this.emitter.emit(GameEvent.PLAYER_OBJECTS_REGISTERD, playerId, objects);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_PLAYERS,
            (playerId: string) => {
                const players = this.playerService.getPlayers();
                this.emitter.emit(GameEvent.PLAYER_PLAYERS_ADDED, playerId, players);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_ADDED,
            (player: Player) => {
                this.emitter.emit(GameEvent.PLAYER_ADDED, player);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_CHANGED,
            (player: Player) => {
                this.emitter.emit(GameEvent.PLAYER_CHANGED, player);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REMOVED,
            (playerId: string) => {
                this.emitter.emit(GameEvent.PLAYER_REMOVED, playerId);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SHOOT,
            (playerId: string, isShooting: boolean) => {
                const tankId = this.playerService.getPlayerTankId(playerId);
                if (tankId === undefined) {
                    return;
                }

                this.tankService.setTankShooting(tankId, isShooting);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_MOVE,
            (playerId: string, direction: Direction) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === undefined) {
                    return;
                }

                if (direction === undefined) {
                    this.gameObjectService.setObjectMoving(player.tankId, false);
                } else {
                    this.gameObjectService.processObjectDirection(player.tankId, direction);
                    this.gameObjectService.setObjectMoving(player.tankId, true);
                }
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SPAWN_STATUS,
            (playerId: string, status: PlayerSpawnStatus) => {
                const player = this.playerService.getPlayer(playerId);

                if (status === PlayerSpawnStatus.SPAWN) {
                    if (player.tankId !== undefined) {
                        return;
                    }

                    const position = this.gameObjectService.getRandomSpawnPosition();
                    const tank = new Tank({
                        position,
                        playerId,
                    });
                    this.gameObjectService.registerObject(tank);
                    this.playerService.setPlayerTankId(playerId, tank.id);
                } else {
                    if (player.tankId === undefined) {
                        return;
                    }

                    this.gameObjectService.unregisterObject(player.tankId);
                    this.playerService.setPlayerTankId(playerId, undefined);
                }
            });

        /**
         * GameObjectService event handlers
         */
        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REQUESTED_DIRECTION,
            (objectId: number, direction: Direction) => {
                this.collisionService.validateObjectDirection(objectId, direction);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REQUESTED_POSITION,
            (objectId: number, position: Point) => {
                this.collisionService.validateObjectMovement(objectId, position);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BOUNDING_BOX_CHANGED,
            (objectId: number) => {
                this.collisionService.updateObjectCollisions(objectId);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_REGISTERED,
            (object: GameObject) => {
                this.collisionService.registerObjectCollisions(object.id);
                this.emitter.emit(GameEvent.OBJECT_REGISTERED, object);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_UNREGISTERED,
            (objectId: number) => {
                this.collisionService.unregisterObjectCollisions(objectId);
                this.emitter.emit(GameEvent.OBJECT_UNREGISTERED, objectId);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_CHANGED,
            (object: GameObject) => {
                this.emitter.emit(GameEvent.OBJECT_CHANGED, object);
            });

        /**
         * TankService event handlers
         */
        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN,
            (tankId: number) => {
                this.bulletService.spawnBulletForTank(tankId);
            });

        /**
         * BulletService event handlers
         */
        this.bulletService.emitter.on(BulletServiceEvent.TANK_BULLET_SPAWNED,
            (tankId: number, bullet: GameObject) => {
                console.log(bullet);
                this.gameObjectService.registerObject(bullet);
            });

        /**
         * CollisionService event handlers
         */
        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED,
            (objectId: number, direction: Direction) => {
                this.gameObjectService.setObjectDirection(objectId, direction);
            });

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_POSITION_ALLOWED,
            (objectId: number, position: Point) => {
                this.gameObjectService.setObjectPosition(objectId, position);
            });

        this.collisionService.emitter.on(CollisionEventType.BULLET_HIT_LEVEL_BORDER,
            (movingObjectId: number, position: Point, staticObjectId: number) => {
                this.gameObjectService.setObjectDestroyed(movingObjectId);
            });

        this.collisionService.emitter.on(CollisionEventType.BULLET_HIT_WALL,
            (movingObjectId: number, position: Point, staticObjectId: number) => {
                this.gameObjectService.setObjectDestroyed(movingObjectId);
                this.gameObjectService.setObjectDestroyed(staticObjectId);
            });

        this.collisionService.emitter.on(CollisionEventType.BULLET_HIT_TANK,
            (movingObjectId: number, position: Point, staticObjectId: number) => {
                console.log('Bullet hit tank');
            });

        this.collisionService.emitter.on(CollisionEventType.BULLET_HIT_BULLET,
            (movingObjectId: number, position: Point, staticObjectId: number) => {
                this.gameObjectService.setObjectDestroyed(movingObjectId);
                this.gameObjectService.setObjectDestroyed(staticObjectId);
            });

        /**
         * Ticker event handlers
         */
        this.ticker.emitter.on(TickerEvent.TICK,
            (deltaSeconds: number) => {
                this.playerService.processPlayerStatus();
                this.tankService.processTanksShooting();
                this.gameObjectService.processObjectsStatus(deltaSeconds);
            });

        this.gameMapService.loadFromFile('./maps/simple.json');
    }

    onPlayerRequestedGameObjectsFromClient(playerId: string): void {
        this.playerService.setPlayerRequestedGameObjects(playerId);
    }

    onPlayerRequestedPlayersFromClient(playerId: string): void {
        this.playerService.setPlayerRequestedPlayers(playerId);
    }

    onPlayerActionFromClient(playerId: string, action: Action): void {
        if (action.type === ActionType.BUTTON_PRESS) {
            this.playerService.addPlayerButtonPressAction(playerId, action as ButtonPressAction);
        }
    }

    onPlayerConnectedFromClient(playerId: string): void {
        this.playerService.createPlayer(playerId);
    }

    onPlayerRequestSpawnStatusFromClient(playerId: string): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, PlayerSpawnStatus.SPAWN);
    }

    onPlayerDisconnectedFromClient(playerId: string): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, PlayerSpawnStatus.DESPAWN);
        this.playerService.setPlayerRequestedDisconnect(playerId);
    }
}
