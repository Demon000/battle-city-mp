import Bullet from '@/bullet/Bullet';
import { BulletPower } from '@/bullet/BulletPower';
import BulletService, { BulletServiceEvent } from '@/bullet/BulletService';
import { Color } from '@/drawable/Color';
import Explosion from '@/explosion/Explosion';
import { ExplosionType } from '@/explosion/ExplosionType';
import { GameObjectType } from '@/object/GameObjectType';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import { Direction } from '@/physics/Direction';
import Tank from '@/tank/Tank';
import TankService, { TankServiceEvent } from '@/tank/TankService';
import { TankTier } from '@/tank/TankTier';
import MapRepository from '@/utils/MapRepository';
import Ticker, { TickerEvent } from '@/utils/Ticker';
import EventEmitter from 'eventemitter3';
import Action, { ActionType } from '../actions/Action';
import ButtonPressAction from '../actions/ButtonPressAction';
import GameMapService, { GameMapServiceEvent } from '../maps/GameMapService';
import GameObject, { GameObjectOptions, PartialGameObjectOptions } from '../object/GameObject';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import { rules } from '../physics/collisions/CollisionRules';
import CollisionService, { CollisionServiceEvent } from '../physics/collisions/CollisionService';
import { CollisionEvent } from '../physics/collisions/ICollisionRule';
import Point from '../physics/point/Point';
import Player, { PlayerSpawnStatus } from '../player/Player';
import PlayerService, { PlayerServiceEvent } from '../player/PlayerService';
import { GameEvent } from './GameEvent';

export interface GameServerEvents {
    [GameEvent.PLAYER_OBJECTS_REGISTERD]: (playerId: string, objects: GameObject[]) => void,
    [GameEvent.PLAYER_PLAYERS_ADDED]: (playerId: string, players: Player[]) => void,
    [GameEvent.PLAYER_ADDED]: (player: Player) => void,
    [GameEvent.PLAYER_CHANGED]: (player: Player) => void,
    [GameEvent.PLAYER_REMOVED]: (playerId: string) => void,
    [GameEvent.OBJECT_REGISTERED]: (object: GameObject) => void,
    [GameEvent.OBJECT_CHANGED]: (objectId: number, options: PartialGameObjectOptions) => void,
    [GameEvent.OBJECT_UNREGISTERED]: (objectId: number) => void,
}

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

    emitter = new EventEmitter<GameServerEvents>();

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
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                this.tankService.setTankShooting(player.tankId, isShooting);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_MOVE,
            (playerId: string, direction: Direction | undefined) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.tankId === null) {
                    return;
                }

                if (direction === undefined) {
                    this.gameObjectService.setObjectMovementDirection(player.tankId, null);
                } else {
                    this.gameObjectService.setObjectMovementDirection(player.tankId, direction);
                }
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SPAWN_STATUS,
            (playerId: string, status: PlayerSpawnStatus) => {
                const player = this.playerService.getPlayer(playerId);

                if (status === PlayerSpawnStatus.SPAWN && player.tankId === null) {
                    const position = this.gameObjectService.getRandomSpawnPosition();
                    const tank = new Tank({
                        position,
                        playerId,
                        color: player.requestedTankColor,
                        tier: player.requestedTankTier,
                    });
                    this.gameObjectService.registerObject(tank);
                    this.playerService.setPlayerTankId(playerId, tank.id);
                } else if (player.tankId !== null) {
                    this.gameObjectService.unregisterObject(player.tankId);
                    this.playerService.setPlayerTankId(playerId, null);
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
            (objectId: number, box: BoundingBox) => {
                this.collisionService.updateObjectCollisions(objectId, box);
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
            (objectId: number, objectOptions: GameObjectOptions) => {
                this.emitter.emit(GameEvent.OBJECT_CHANGED, objectId, objectOptions);
            });

        /**
         * TankService event handlers
         */
        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN,
            (tankId: number) => {
                const tank = this.tankService.getTank(tankId);
                this.bulletService.spawnBulletForTank(tank);
            });

        /**
         * BulletService event handlers
         */
        this.bulletService.emitter.on(BulletServiceEvent.BULLET_SPAWNED,
            (bullet: Bullet) => {
                this.gameObjectService.registerObject(bullet);
                this.tankService.addTankBullet(bullet.tankId, bullet.id);
                this.tankService.setTankLastBulletShotTime(bullet.tankId, bullet.spawnTime);
            });

        /**
         * CollisionService event handlers
         */
        const spawnExplosion = (objectId: number, type: ExplosionType, destroyedObjectType?: GameObjectType) => {
            const object = this.gameObjectService.getObject(objectId);
            const explosion = new Explosion({
                explosionType: type,
                position: object.centerPosition,
                destroyedObjectType,
            });
            this.gameObjectService.registerObject(explosion);
        };

        const destroyBullet = (bulletId: number) => {
            const bullet = this.bulletService.getBullet(bulletId);
            this.gameObjectService.setObjectDestroyed(bulletId);
            const tank = this.tankService.findTank(bullet.tankId);
            if (tank === undefined) {
                return;
            }

            this.tankService.removeTankBullet(bullet.tankId, bulletId);
        };

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED,
            (objectId: number, direction: Direction) => {
                this.gameObjectService.setObjectDirection(objectId, direction);
            });

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_POSITION_ALLOWED,
            (objectId: number, position: Point) => {
                this.gameObjectService.setObjectPosition(objectId, position);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            (movingObjectId: number, _position: Point, _staticObjectId: number) => {
                spawnExplosion(movingObjectId, ExplosionType.SMALL, GameObjectType.NONE);
                destroyBullet(movingObjectId);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            (bulletId: number, _position: Point, steelWallId: number) => {
                const bullet = this.bulletService.getBullet(bulletId);
                destroyBullet(bulletId);
                if (bullet.power === BulletPower.HEAVY) {
                    spawnExplosion(bulletId, ExplosionType.SMALL);
                    this.gameObjectService.setObjectDestroyed(steelWallId);
                } else {
                    spawnExplosion(bulletId, ExplosionType.SMALL, GameObjectType.NONE);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BRICK_WALL,
            (bulletId: number, _position: Point, brickWallId: number) => {
                const destroyBox = this.bulletService.getBulletBrickWallDestroyBox(bulletId, brickWallId);
                const objectsIds = this.collisionService.getOverlappingObjects(destroyBox);
                const objects = this.gameObjectService.getMultipleObjects(objectsIds);
                const brickWalls = objects.filter(o => o.type === GameObjectType.BRICK_WALL);
                spawnExplosion(bulletId, ExplosionType.SMALL);
                destroyBullet(bulletId);
                for (const brickWall of brickWalls) {
                    this.gameObjectService.setObjectDestroyed(brickWall.id);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_TANK,
            (bulletId: number, _position: Point, tankId: number) => {
                spawnExplosion(bulletId, ExplosionType.SMALL);
                spawnExplosion(tankId, ExplosionType.BIG, GameObjectType.TANK);
                destroyBullet(bulletId);

                const tank = this.tankService.getTank(tankId);
                this.playerService.setPlayerRequestedSpawnStatus(tank.playerId, PlayerSpawnStatus.DESPAWN);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            (movingObjectId: number, _position: Point, staticObjectId: number) => {
                spawnExplosion(movingObjectId, ExplosionType.SMALL);
                destroyBullet(movingObjectId);
                destroyBullet(staticObjectId);
            });

        this.collisionService.emitter.on(CollisionEvent.TANK_ON_ICE,
            (tankId: number, _position: Point, _iceId: number) => {
                this.tankService.setTankOnIce(tankId);
            });

        /**
         * Ticker event handlers
         */
        this.ticker.emitter.on(TickerEvent.TICK,
            (deltaSeconds: number) => {
                this.playerService.processPlayersStatus();
                this.tankService.processTanksStatus();
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

    onPlayerRequestSpawnStatusFromClient(playerId: string, spawnStatus: PlayerSpawnStatus): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, spawnStatus);
    }

    onPlayerDisconnectedFromClient(playerId: string): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, PlayerSpawnStatus.DESPAWN);
        this.playerService.setPlayerRequestedDisconnect(playerId);
    }

    onPlayerRequestTankColorFromClient(playerId: string, color: Color): void {
        this.playerService.setPlayerRequestedTankColor(playerId, color);
    }

    onPlayerRequestTankTierFromClient(playerId: string, tier: TankTier): void {
        this.playerService.setPlayerRequestedTankTier(playerId, tier);
    }
}
