import Bullet from '@/bullet/Bullet';
import { BulletPower } from '@/bullet/BulletPower';
import BulletService, { BulletServiceEvent } from '@/bullet/BulletService';
import { SERVER_CONFIG_TPS } from '@/config';
import { Color } from '@/drawable/Color';
import Explosion from '@/explosion/Explosion';
import { ExplosionType } from '@/explosion/ExplosionType';
import GameObjectFactory from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import CollisionTracker from '@/physics/collisions/CollisionTracker';
import { Direction } from '@/physics/Direction';
import Tank, { PartialTankOptions } from '@/tank/Tank';
import TankService, { TankServiceEvent } from '@/tank/TankService';
import { TankTier } from '@/tank/TankTier';
import MapRepository from '@/utils/MapRepository';
import Ticker, { TickerEvent } from '@/utils/Ticker';
import EventEmitter from 'eventemitter3';
import Action, { ActionType } from '../actions/Action';
import ButtonPressAction from '../actions/ButtonPressAction';
import GameMapService, { GameMapServiceEvent } from '../maps/GameMapService';
import GameObject, { GameObjectOptions } from '../object/GameObject';
import GameObjectService, { GameObjectServiceEvent } from '../object/GameObjectService';
import BoundingBoxRepository from '../physics/bounding-box/BoundingBoxRepository';
import { rules } from '../physics/collisions/CollisionRules';
import CollisionService, { CollisionServiceEvent } from '../physics/collisions/CollisionService';
import { CollisionEvent } from '../physics/collisions/ICollisionRule';
import Point from '../physics/point/Point';
import Player, { PlayerSpawnStatus } from '../player/Player';
import PlayerService, { PlayerServiceEvent } from '../player/PlayerService';
import { BroadcastBatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import GameEventBatcher, { GameEventBatcherEvent } from './GameEventBatcher';

export interface GameServerEvents {
    [GameEvent.BROADCAST_BATCH]: (events: BroadcastBatchGameEvent[]) => void,
    [GameEvent.PLAYER_BATCH]: (playerId: string, events: UnicastBatchGameEvent[]) => void,
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
    private gameEventBatcher;
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
        this.gameEventBatcher = new GameEventBatcher();
        this.ticker = new Ticker(SERVER_CONFIG_TPS);

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
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SERVER_STATUS,
            (playerId: string) => {
                const objectsOptions = this.gameObjectService.getObjects().map(object => object.toOptions());
                const playersOptions = this.playerService.getPlayers().map(player => player.toOptions());
                this.gameEventBatcher.addPlayerEvent(playerId, [GameEvent.SERVER_STATUS, {
                    objectsOptions,
                    playersOptions,
                    tps: SERVER_CONFIG_TPS,
                }]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_ADDED,
            (player: Player) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_ADDED, player.toOptions()]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_CHANGED,
            (player: Player) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_CHANGED, player.toOptions()]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REMOVED,
            (playerId: string) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_REMOVED, playerId]);
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
                        playerName: player.displayName,
                        color: player.requestedTankColor,
                        tier: player.requestedTankTier,
                    });
                    this.gameObjectService.registerObject(tank);
                } else if (status === PlayerSpawnStatus.DESPAWN && player.tankId !== null) {
                    this.gameObjectService.unregisterObject(player.tankId);
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
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_REGISTERED, object.toOptions()]);

                switch (object.type) {
                    case GameObjectType.TANK: {
                        const tank = object as Tank;
                        this.playerService.setPlayerTankId(tank.playerId, tank.id);
                        break;
                    }
                    case GameObjectType.BULLET: {
                        const bullet = object as Bullet;
                        this.tankService.addTankBullet(bullet.tankId, bullet.id);
                        break;
                    }
                }
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_UNREGISTERED,
            (objectId: number) => {
                this.collisionService.unregisterObjectCollisions(objectId);
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_UNREGISTERED, objectId]);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_CHANGED,
            (objectId: number, objectOptions: GameObjectOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_CHANGED, objectId, objectOptions]);
            });

        this.gameObjectService.emitter.on(GameObjectServiceEvent.OBJECT_BEFORE_UNREGISTER,
            (objectId: number) => {
                const object = this.gameObjectService.getObject(objectId);

                switch (object.type) {
                    case GameObjectType.TANK: {
                        const tank = object as Tank;
                        this.playerService.setPlayerTankId(tank.playerId, null);
                        break;
                    }
                    case GameObjectType.BULLET: {
                        const bullet = object as Bullet;
                        const tank = this.tankService.findTank(bullet.tankId);
                        if (tank === undefined) {
                            break;
                        }

                        this.tankService.removeTankBullet(bullet.tankId, objectId);
                        break;
                    }
                }
            });

        /**
         * TankService event handlers
         */
        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_BULLET_SPAWN,
            (tankId: number) => {
                const tank = this.tankService.getTank(tankId);
                this.bulletService.spawnBulletForTank(tank);
            });

        this.tankService.emitter.on(TankServiceEvent.TANK_REQUESTED_SMOKE_SPAWN,
            (tankId: number) => {
                const tank = this.tankService.getTank(tankId);
                const smoke = new GameObject({
                    type: GameObjectType.SMOKE,
                    position: tank.centerPosition,
                });
                this.gameObjectService.registerObject(smoke);
            });

        this.tankService.emitter.on(TankServiceEvent.TANK_UPDATED,
            (tankId: number, tankOptions: PartialTankOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.OBJECT_CHANGED, tankId, tankOptions]);
            });

        /**
         * BulletService event handlers
         */
        this.bulletService.emitter.on(BulletServiceEvent.BULLET_SPAWNED,
            (bullet: Bullet) => {
                this.gameObjectService.registerObject(bullet);
            });

        /**
         * CollisionService event handlers
         */
        const spawnExplosion = (position: Point, type: ExplosionType, destroyedObjectType?: GameObjectType) => {
            const explosion = new Explosion({
                explosionType: type,
                position: position,
                destroyedObjectType,
            });
            this.gameObjectService.registerObject(explosion);
        };

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_DIRECTION_ALLOWED,
            (objectId: number, direction: Direction) => {
                this.gameObjectService.setObjectDirection(objectId, direction);
            });

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_POSITION_ALLOWED,
            (objectId: number, position: Point) => {
                this.gameObjectService.setObjectPosition(objectId, position);
            });

        this.collisionService.emitter.on(CollisionServiceEvent.OBJECT_TRACKED_COLLISIONS,
            (objectId: number, tracker: CollisionTracker) => {
                const object = this.gameObjectService.getObject(objectId);

                switch (object.type) {
                    case GameObjectType.TANK:
                        this.tankService.updateTankCollisions(objectId, tracker);
                        break;
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            (bulletId: number, _staticObjectId: number, position: Point) => {
                spawnExplosion(position, ExplosionType.SMALL, GameObjectType.NONE);
                this.gameObjectService.setObjectDestroyed(bulletId);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            (bulletId: number, steelWallId: number, position: Point) => {
                const bullet = this.bulletService.getBullet(bulletId);
                this.gameObjectService.setObjectDestroyed(bulletId);
                if (bullet.power === BulletPower.HEAVY) {
                    spawnExplosion(position, ExplosionType.SMALL);
                    this.gameObjectService.setObjectDestroyed(steelWallId);
                } else {
                    spawnExplosion(position, ExplosionType.SMALL, GameObjectType.NONE);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BRICK_WALL,
            (bulletId: number, brickWallId: number, position: Point) => {
                const destroyBox = this.bulletService.getBulletBrickWallDestroyBox(bulletId, brickWallId);
                const objectsIds = this.collisionService.getOverlappingObjects(destroyBox);
                const objects = this.gameObjectService.getMultipleObjects(objectsIds);
                const brickWalls = objects.filter(o => o.type === GameObjectType.BRICK_WALL);
                spawnExplosion(position, ExplosionType.SMALL);
                this.gameObjectService.setObjectDestroyed(bulletId);
                for (const brickWall of brickWalls) {
                    this.gameObjectService.setObjectDestroyed(brickWall.id);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_TANK,
            (bulletId: number, tankId: number, position: Point) => {
                const bullet = this.bulletService.getBullet(bulletId);
                if (bullet.tankId === tankId) {
                    return;
                }

                const tank = this.tankService.getTank(tankId);
                const tankHealth = tank.health;
                const bulletDamage = bullet.damage;

                tank.health -= bulletDamage;
                bullet.damage -= tankHealth;

                if (tank.health <= 0) {
                    spawnExplosion(position, ExplosionType.SMALL);
                    spawnExplosion(tank.centerPosition, ExplosionType.BIG, GameObjectType.TANK);
                    this.playerService.setPlayerRequestedSpawnStatus(tank.playerId, PlayerSpawnStatus.DESPAWN);
                    this.playerService.addPlayerDeath(tank.playerId);
                    if (bullet.playerId !== undefined) {
                        this.playerService.addPlayerKill(bullet.playerId);
                    }
                } else {
                    spawnExplosion(position, ExplosionType.SMALL, GameObjectType.NONE);
                }

                if (bullet.damage <= 0) {
                    this.gameObjectService.setObjectDestroyed(bulletId);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            (movingBulletId: number, staticBulletId: number, position: Point) => {
                spawnExplosion(position, ExplosionType.SMALL);
                this.gameObjectService.setObjectDestroyed(movingBulletId);
                this.gameObjectService.setObjectDestroyed(staticBulletId);
            });

        /**
         * Game Event Batcher events
         */
        this.gameEventBatcher.emitter.on(GameEventBatcherEvent.BROADCAST_BATCH,
            (events: BroadcastBatchGameEvent[]) => {
                this.emitter.emit(GameEvent.BROADCAST_BATCH, events);
            });

        this.gameEventBatcher.emitter.on(GameEventBatcherEvent.PLAYER_BATCH,
            (playerId: string, events: UnicastBatchGameEvent[]) => {
                this.emitter.emit(GameEvent.PLAYER_BATCH, playerId, events);
            });

        /**
         * Ticker event handlers
         */
        this.ticker.emitter.on(TickerEvent.TICK,
            (deltaSeconds: number) => {
                this.playerService.processPlayersStatus();
                this.tankService.processTanksStatus();
                this.gameObjectService.processObjectsStatus(deltaSeconds);
                this.gameEventBatcher.flush();
            });

        this.gameMapService.loadFromFile('./maps/simple.json');
    }

    onPlayerRequestedServerStatusFromClient(playerId: string): void {
        this.playerService.setPlayerRequestedServerStatus(playerId);
    }

    onPlayerActionFromClient(playerId: string, action: Action): void {
        if (action.type === ActionType.BUTTON_PRESS) {
            this.playerService.addPlayerButtonPressAction(playerId, action as ButtonPressAction);
        }
    }

    onPlayerConnectedFromClient(playerId: string): void {
        this.playerService.createPlayer(playerId);
        this.playerService.setPlayerRequestedServerStatus(playerId);
    }

    onPlayerSetName(playerId: string, name: string): void {
        this.playerService.setPlayerName(playerId, name);
    }

    onPlayerMapEditorCreateObjects(objectsOptions: GameObjectOptions[]): void {
        const objects = objectsOptions.map(o => GameObjectFactory.buildFromOptions(o));
        this.gameObjectService.registerObjects(objects);
    }

    onPlayerMapEditorDestroyObjects(destroyBox: BoundingBox): void {
        const objectsIds = this.collisionService.getOverlappingObjects(destroyBox);
        const objects = this.gameObjectService.getMultipleObjects(objectsIds);
        objects
            .filter(o => o.type !== GameObjectType.TANK)
            .forEach(o => this.gameObjectService.unregisterObject(o.id));
    }

    onPlayerMapEditorSave(): void {
        const objects = this.gameObjectService.getObjects();
        this.gameMapService.setMapObjects(objects);
        this.gameMapService.saveToFile();
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
