import Bullet from '@/bullet/Bullet';
import { BulletPower } from '@/bullet/BulletPower';
import BulletService, { BulletServiceEvent } from '@/bullet/BulletService';
import { SERVER_CONFIG_TPS } from '@/config';
import { Color } from '@/drawable/Color';
import Explosion from '@/explosion/Explosion';
import { ExplosionType } from '@/explosion/ExplosionType';
import { GameModesProperties, SameTeamBulletHitMode } from '@/game-mode/IGameModeProperties';
import GameObjectFactory from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import CollisionTracker from '@/physics/collisions/CollisionTracker';
import { Direction } from '@/physics/Direction';
import Tank, { PartialTankOptions } from '@/tank/Tank';
import TankService, { TankServiceEvent } from '@/tank/TankService';
import { TankTier } from '@/tank/TankTier';
import Team, { TeamOptions } from '@/team/Team';
import TeamService, { TeamServiceEvent } from '@/team/TeamService';
import LazyIterable from '@/utils/LazyIterable';
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
import Player, { PartialPlayerOptions, PlayerSpawnStatus } from '../player/Player';
import PlayerService, { PlayerServiceEvent } from '../player/PlayerService';
import { BroadcastBatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import GameEventBatcher, { GameEventBatcherEvent } from './GameEventBatcher';
import JSON5 from 'json5';
import GameModeService from '@/game-mode/GameModeService';
import { assertType } from 'typescript-is';
import fs from 'fs';
import EntityFactory from '@/entity/EntityFactory';
import Registry from '@/ecs/Registry';
import RegistryNumberIdGenerator from '@/ecs/RegistryNumberIdGenerator';
import ComponentRegistry from '@/components/ComponentRegistry';
import EntityBlueprint from '@/entity/EntityBlueprint';

export interface GameServerEvents {
    [GameEvent.BROADCAST_BATCH]: (events: BroadcastBatchGameEvent[]) => void,
    [GameEvent.PLAYER_BATCH]: (playerId: string, events: UnicastBatchGameEvent[]) => void,
}

export default class GameServer {
    private registry;
    private entityFactory;
    private componentRegistry;

    private entityBlueprints;

    private gameModesPropertiesText;
    private gameModesPropertiesData;
    private gameModesProperties;
    private gameModeService;
    private gameObjectFactory;
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
    private teamRepository;
    private teamService;
    ticker;

    emitter = new EventEmitter<GameServerEvents>();

    constructor() {
        const registryIdGenerator = new RegistryNumberIdGenerator();
        this.registry = new Registry(registryIdGenerator);

        const entitiesBlueprintText = fs.readFileSync('./entity/entities-blueprint.json5', 'utf8');
        const entitiesBlueptintData = JSON5.parse(entitiesBlueprintText);
        this.componentRegistry = new ComponentRegistry();
        this.entityBlueprints = new EntityBlueprint(this.componentRegistry, entitiesBlueptintData);
        this.entityFactory = new EntityFactory(this.registry, this.entityBlueprints);

        this.gameModesPropertiesText = fs.readFileSync('./game-mode/game-modes-properties.json5', 'utf8');
        this.gameModesPropertiesData = JSON5.parse(this.gameModesPropertiesText);
        this.gameModesProperties = assertType<GameModesProperties>(this.gameModesPropertiesData);
        this.gameModeService = new GameModeService(this.gameModesProperties);
        this.gameObjectFactory = new GameObjectFactory();
        this.gameObjectRepository = new MapRepository<number, GameObject>();
        this.boundingBoxRepository = new BoundingBoxRepository<number>();
        this.collisionRules = rules;
        this.collisionService = new CollisionService(this.gameObjectRepository,
            this.boundingBoxRepository, this.collisionRules);
        this.gameObjectService = new GameObjectService(this.gameObjectRepository);
        this.tankService = new TankService(this.gameObjectRepository);
        this.bulletService = new BulletService(this.gameObjectRepository);
        this.gameMapService = new GameMapService();
        this.playerRepository = new MapRepository<string, Player>();
        this.playerService = new PlayerService(this.playerRepository);
        this.teamRepository = new MapRepository<string, Team>();
        this.teamService = new TeamService(this.teamRepository);
        this.gameEventBatcher = new GameEventBatcher();
        this.ticker = new Ticker(SERVER_CONFIG_TPS);

        console.log(this.entityFactory.buildBrickWall(
            {
                x: 0,
                y: 0,
            },
        ));

        /**
         * GameMapService event handlers
         */
        this.gameMapService.emitter.on(GameMapServiceEvent.MAP_OBJECTS_OPTIONS,
            (objectsOptions: GameObjectOptions[]) => {
                const objects = objectsOptions.map(o => this.gameObjectFactory.buildFromOptions(o));
                this.gameObjectService.registerObjects(objects);
            });

        this.gameMapService.emitter.on(GameMapServiceEvent.MAP_TEAMS_OPTIONS,
            (teamsOptions: TeamOptions[]) => {
                const teams = teamsOptions.map(o => new Team(o));
                this.teamService.addTeams(teams);
            });

        /**
         * PlayerService event handlers
         */
        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_REQUESTED_SERVER_STATUS,
            (playerId: string) => {
                const objects = this.gameObjectService.getObjects();
                const objectsOptions =
                    LazyIterable.from(objects)
                        .map(object => object.toOptions())
                        .toArray();
                const players = this.playerService.getPlayers();
                const playersOptions =
                    LazyIterable.from(players)
                        .map(player => player.toOptions())
                        .toArray();
                const teams = this.teamService.getTeams();
                let teamsOptions;
                if (teams !== undefined) {
                    teamsOptions =
                        LazyIterable.from(teams)
                            .map(team => team.toOptions())
                            .toArray();
                }
                this.gameEventBatcher.addPlayerEvent(playerId, [GameEvent.SERVER_STATUS, {
                    objectsOptions,
                    playersOptions,
                    teamsOptions,
                    tps: SERVER_CONFIG_TPS,
                }]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_ADDED,
            (player: Player) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_ADDED, player.toOptions()]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_CHANGED,
            (playerId: string, playerOptions: PartialPlayerOptions) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.PLAYER_CHANGED, playerId, playerOptions]);
            });

        this.playerService.emitter.on(PlayerServiceEvent.PLAYER_BEFORE_REMOVE,
            (playerId: string) => {
                const player = this.playerService.getPlayer(playerId);
                if (player.teamId === null) {
                    return;
                }

                this.teamService.removeTeamPlayer(player.teamId, playerId);
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
                    let teamId;
                    const gameModeProperties = this.gameModeService.getGameModeProperties();
                    if (gameModeProperties.hasTeams && player.teamId === null) {
                        const team = this.teamService.getTeamWithLeastPlayers();
                        this.setPlayerTeam(playerId, team.id);
                        teamId = team.id;
                    } else if (gameModeProperties.hasTeams && player.teamId !== null) {
                        teamId = player.teamId;
                    }

                    let tankColor;
                    if (gameModeProperties.hasTeams && player.teamId !== null) {
                        const team = this.teamService.getTeam(player.teamId);
                        tankColor = team.color;
                    } else {
                        tankColor = player.requestedTankColor;
                    }

                    const position = this.gameObjectService.getRandomSpawnPosition(teamId);
                    const tank = new Tank({
                        position,
                        playerId,
                        playerName: player.displayName,
                        color: tankColor,
                        tier: player.requestedTankTier,
                    });
                    this.gameObjectService.registerObject(tank);
                } else if (status === PlayerSpawnStatus.DESPAWN && player.tankId !== null) {
                    this.gameObjectService.unregisterObject(player.tankId);
                }
            });

        /**
         * TeamService event handlers
         */
        this.teamService.emitter.on(TeamServiceEvent.TEAM_PLAYER_ADDED,
            (teamId: string, playerId: string) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.TEAM_PLAYER_ADDED, teamId, playerId]);
            });

        this.teamService.emitter.on(TeamServiceEvent.TEAM_PLAYER_REMOVED,
            (teamId: string, playerId: string) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.TEAM_PLAYER_REMOVED, teamId, playerId]);
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
            (objectId: number, objectOptions: PartialGameObjectOptions) => {
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
            (bulletId: number, _staticObjectId: number, _position: Point) => {
                const bullet = this.gameObjectService.getObject(bulletId);
                spawnExplosion(bullet.centerPosition, ExplosionType.SMALL, GameObjectType.NONE);
                this.gameObjectService.setObjectDestroyed(bulletId);
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            (bulletId: number, steelWallId: number, _position: Point) => {
                const bullet = this.bulletService.getBullet(bulletId);
                this.gameObjectService.setObjectDestroyed(bulletId);
                if (bullet.power === BulletPower.HEAVY) {
                    spawnExplosion(bullet.centerPosition, ExplosionType.SMALL);
                    this.gameObjectService.setObjectDestroyed(steelWallId);
                } else {
                    spawnExplosion(bullet.centerPosition, ExplosionType.SMALL, GameObjectType.NONE);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BRICK_WALL,
            (bulletId: number, brickWallId: number, _position: Point) => {
                const destroyBox = this.bulletService.getBulletBrickWallDestroyBox(bulletId, brickWallId);
                const objectsIds = this.collisionService.getOverlappingObjects(destroyBox);
                const objects = this.gameObjectService.getMultipleObjects(objectsIds);
                const bullet = this.gameObjectService.getObject(bulletId);
                spawnExplosion(bullet.centerPosition, ExplosionType.SMALL);
                this.gameObjectService.setObjectDestroyed(bulletId);

                LazyIterable.from(objects)
                    .filter(o => o.type === GameObjectType.BRICK_WALL)
                    .forEach(brickWall => {
                        this.gameObjectService.setObjectDestroyed(brickWall.id);
                    });
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_TANK,
            (bulletId: number, tankId: number, _position: Point) => {
                const bullet = this.bulletService.getBullet(bulletId);
                if (bullet.tankId === tankId) {
                    return;
                }

                const tank = this.tankService.getTank(tankId);
                const gameModeProperties = this.gameModeService.getGameModeProperties();

                let ignoreBulletDamage = false;
                let destroyBullet = false;
                if (SameTeamBulletHitMode.DESTROY === gameModeProperties.sameTeamBulletHitMode
                    || SameTeamBulletHitMode.PASS === gameModeProperties.sameTeamBulletHitMode) {
                    const tankPlayer = this.playerService.getPlayer(tank.playerId);

                    let bulletPlayer;
                    if (bullet.playerId !== undefined) {
                        bulletPlayer = this.playerService.getPlayer(bullet.playerId);
                    }

                    if (bulletPlayer !== undefined && bulletPlayer.teamId === tankPlayer.teamId) {
                        ignoreBulletDamage = true;

                        if (gameModeProperties.sameTeamBulletHitMode === SameTeamBulletHitMode.DESTROY) {
                            destroyBullet = true;
                        }
                    }
                }

                if (!ignoreBulletDamage) {
                    const tankHealth = tank.health;
                    const bulletDamage = bullet.damage;

                    tank.health -= bulletDamage;
                    bullet.damage -= tankHealth;
                }

                if (tank.health <= 0) {
                    spawnExplosion(tank.centerPosition, ExplosionType.BIG, GameObjectType.TANK);
                    this.playerService.setPlayerRequestedSpawnStatus(tank.playerId, PlayerSpawnStatus.DESPAWN);
                    this.playerService.addPlayerDeath(tank.playerId);
                    if (bullet.playerId !== undefined) {
                        this.playerService.addPlayerKill(bullet.playerId);
                    }
                } else {
                    spawnExplosion(bullet.centerPosition, ExplosionType.SMALL, GameObjectType.NONE);
                }

                if (destroyBullet || bullet.damage <= 0) {
                    spawnExplosion(bullet.centerPosition, ExplosionType.SMALL);
                    this.gameObjectService.setObjectDestroyed(bulletId);
                }
            });

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            (movingBulletId: number, staticBulletId: number, _position: Point) => {
                const movingBullet = this.bulletService.getBullet(movingBulletId);
                const staticBullet = this.bulletService.getBullet(staticBulletId);
                if (movingBullet.tankId === staticBullet.tankId) {
                    return;
                }

                spawnExplosion(movingBullet.centerPosition, ExplosionType.SMALL);
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

        this.gameModeService.setGameMode('team-deathmatch');
        this.gameMapService.loadFromFile('./maps/simple.json');
    }

    onPlayerRequestedServerStatus(playerId: string): void {
        this.playerService.setPlayerRequestedServerStatus(playerId);
    }

    onPlayerAction(playerId: string, action: Action): void {
        if (action.type === ActionType.BUTTON_PRESS) {
            this.playerService.addPlayerButtonPressAction(playerId, action as ButtonPressAction);
        }
    }

    onPlayerConnected(playerId: string): void {
        this.playerService.createPlayer(playerId);
        this.playerService.setPlayerRequestedServerStatus(playerId);
    }

    onPlayerSetName(playerId: string, name: string): void {
        this.playerService.setPlayerName(playerId, name);
    }

    onMapEditorEnable(playerId: string, enabled: boolean): void {
        const player = this.playerService.getPlayer(playerId);
        if (player.tankId === null) {
            return;
        }

        const tank = this.tankService.getTank(player.tankId);
        if (tank === undefined) {
            return;
        }

        tank.collisionsDisabled = enabled;
    }

    onMapEditorCreateObjects(objectsOptions: GameObjectOptions[]): void {
        const objects = objectsOptions.map(o => this.gameObjectFactory.buildFromOptions(o));
        this.gameObjectService.registerObjects(objects);
    }

    onMapEditorDestroyObjects(destroyBox: BoundingBox): void {
        const objectsIds = this.collisionService.getOverlappingObjects(destroyBox);
        const objects = this.gameObjectService.getMultipleObjects(objectsIds);
        LazyIterable.from(objects)
            .filter(o => o.type !== GameObjectType.TANK)
            .forEach(o => this.gameObjectService.unregisterObject(o.id));
    }

    onMapEditorSave(): void {
        const objects = this.gameObjectService.getObjects();
        this.gameMapService.setMapObjects(objects);
        this.gameMapService.saveToFile();
    }

    onPlayerRequestSpawnStatus(playerId: string, spawnStatus: PlayerSpawnStatus): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, spawnStatus);
    }

    setPlayerTeam(playerId: string, teamId: string): void {
        const player = this.playerService.getPlayer(playerId);
        if (player.teamId !== null) {
            this.teamService.removeTeamPlayer(player.teamId, playerId);
        }

        this.teamService.addTeamPlayer(teamId, playerId);
        this.playerService.setPlayerTeam(playerId, teamId);
    }

    onPlayerRequestedTeam(playerId: string, teamId: string): void {
        const gameModeProperties = this.gameModeService.getGameModeProperties();
        if (!gameModeProperties.hasTeams) {
            return;
        }

        const team = this.teamService.findTeamById(teamId);
        if (team === undefined) {
            return;
        }

        const player = this.playerService.getPlayer(playerId);
        let existingTeam;
        if (player.teamId !== null) {
            existingTeam = this.teamService.getTeam(player.teamId);
        } else {
            existingTeam = this.teamService.getTeamWithLeastPlayers();
        }

        if (!this.teamService.isTeamSwitchingAllowed(existingTeam.id, team.id)) {
            return;
        }

        this.setPlayerTeam(playerId, teamId);
    }

    onPlayerDisconnected(playerId: string): void {
        this.playerService.setPlayerRequestedSpawnStatus(playerId, PlayerSpawnStatus.DESPAWN);
        this.playerService.setPlayerRequestedDisconnect(playerId);
    }

    onPlayerRequestTankColor(playerId: string, color: Color): void {
        const gameModeProperties = this.gameModeService.getGameModeProperties();
        if (!gameModeProperties.hasTeams) {
            return;
        }

        this.playerService.setPlayerRequestedTankColor(playerId, color);
    }

    onPlayerRequestTankTier(playerId: string, tier: TankTier): void {
        this.playerService.setPlayerRequestedTankTier(playerId, tier);
    }
}
