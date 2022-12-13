import { ComponentLookupTable } from '@/ecs/ComponentLookupTable';
import '../components/index';

import { Color } from '@/drawable/Color';
import { EntityFactory, EntityBuildOptions } from '@/entity/EntityFactory';
import { TankTier } from '@/subtypes/TankTier';
import { LazyIterable } from '@/utils/LazyIterable';
import { Ticker, TickerEvent } from '@/utils/Ticker';
import EventEmitter from 'eventemitter3';
import { Action, ActionType } from '../actions/Action';
import { ButtonPressAction } from '../actions/ButtonPressAction';
import { GameMapService } from '../maps/GameMapService';
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { CollisionService } from '../physics/collisions/CollisionService';
import { CollisionEvent } from '../physics/collisions/CollisionRule';
import { BroadcastBatchGameEvent, CommonBatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import { GameEventBatcher, GameEventBatcherEvent } from './GameEventBatcher';
import { GameModeService } from '@/services/GameModeService';
import { Registry } from '@/ecs/Registry';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { Config } from '@/config/Config';
import { TimeService, TimeServiceEvent } from '@/time/TimeService';
import { GameMap } from '@/maps/GameMap';
import { assert } from '@/utils/assert';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { processActiveEntitySpawners } from '@/logic/entity-spawner';
import { processDirection, processMovement } from '@/logic/entity-movement';
import { destroyAllWorldEntities, processAutomaticDestroy } from '@/logic/entity-destroy';
import { onBulletHitBrickWall, onBulletHitBullet, onBulletHitLevelBorder, onBulletHitSteelWall, onBulletHitTank } from '@/logic/bullet';
import { onEntityCollideTeleporter } from '@/logic/entity-teleporter';
import { addPlayerButtonPressAction, cancelPlayersActions, createPlayer, onPlayerRequestedTeam, processPlayerDisconnectStatus, processPlayerDroppingFlag, processPlayerMovement, processPlayerRespawnTimeout, processPlayerShooting, processPlayerSpawnStatus, resetPlayers, setPlayerName, setPlayerRequestedDisconnect, setPlayerRequestedServerStatus, setPlayerRequestedSpawnStatus, setPlayerRequestedTankColor, setPlayerRequestedTankTier } from '@/logic/player';
import { onTankCollideFlag, onTankCollideFlagBase } from '@/logic/tank';
import { PlayerComponent } from '@/components/PlayerComponent';
import { EntityId } from '@/ecs/EntityId';
import { processDirtyRelativePosition } from '@/logic/entity-relative-position';
import { gameServerEventHandlers } from './GameServerEventHandlers';
import { registerEventHandler } from './EventHandler';

export enum GameServerEvent {
    PLAYER_BATCH = 'p',
    BROADCAST_BATCH = 'b',
}

export interface GameServerEvents {
    [GameServerEvent.BROADCAST_BATCH]: (events: BroadcastBatchGameEvent[]) => void;
    [GameServerEvent.PLAYER_BATCH]: (playerId: EntityId, events: UnicastBatchGameEvent[]) => void;
}

export class GameServer {
    private registryIdGenerator;
    private registry;

    private config;
    private gameModeService;
    private entityFactory;
    private gameMapService;
    private collisionService;
    private gameEventBatcher;
    private timeService;
    private pluginContext;
    ticker;

    emitter = new EventEmitter<GameServerEvents>();

    constructor(mapName: string, gameMode: string) {
        this.config = new Config();
        this.config.loadDir('./configs');

        const componentRegistry = new ComponentLookupTable();
        const entityBlueprint = new EntityBlueprint(this.config, BlueprintEnv.SERVER, true);

        this.registryIdGenerator = new RegistryNumberIdGenerator();
        this.registry = new Registry(componentRegistry, this.registryIdGenerator);
        this.entityFactory = new EntityFactory(this.registry, entityBlueprint);

        const boundingBoxRepository = new BoundingBoxRepository<string>();

        this.gameModeService = new GameModeService(this.config);
        this.collisionService = new CollisionService(boundingBoxRepository, this.registry);
        this.gameMapService = new GameMapService(entityBlueprint);
        this.timeService = new TimeService(this.config);
        this.gameEventBatcher = new GameEventBatcher();

        const ticksPerSecond = this.config.get<number>('game-server', 'ticksPerSecond');
        this.ticker = new Ticker(ticksPerSecond);

        this.pluginContext = {
            batcher: this.gameEventBatcher,
            registry: this.registry,
            entityFactory: this.entityFactory,
            collisionService: this.collisionService,
            gameModeService: this.gameModeService,
        };

        for (const handler of gameServerEventHandlers) {
            registerEventHandler(this.pluginContext, handler);
        }

        const bindContext = (fn: Function) => fn.bind(this.pluginContext);

        /**
         * CollisionService event handlers
         */
        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            bindContext(onBulletHitLevelBorder));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_STEEL_WALL,
            bindContext(onBulletHitSteelWall));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BRICK_WALL,
            bindContext(onBulletHitBrickWall));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_TANK,
            bindContext(onBulletHitTank));

        this.collisionService.emitter.on(CollisionEvent.BULLET_HIT_BULLET,
            bindContext(onBulletHitBullet));

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG,
            bindContext(onTankCollideFlag));

        this.collisionService.emitter.on(CollisionEvent.TANK_COLLIDE_FLAG_BASE,
            bindContext(onTankCollideFlagBase));

        this.collisionService.emitter.on(CollisionEvent.ENTITY_COLLIDE_TELEPORTER,
            bindContext(onEntityCollideTeleporter));

        /*
         * Time Service event handlers
         */
        this.timeService.emitter.on(TimeServiceEvent.ROUND_TIME_UPDATED,
            (roundTime: number) => {
                this.gameEventBatcher.addBroadcastEvent([GameEvent.ROUND_TIME_UPDATED, roundTime]);
            });
        this.timeService.emitter.on(TimeServiceEvent.SCOREBOARD_WATCH_TIME,
            (value: boolean) => {
                if (value) {
                    cancelPlayersActions(this.registry);
                }
            });

        /**
         * Game Event Batcher event handlers
         */
        this.gameEventBatcher.emitter.on(GameEventBatcherEvent.BROADCAST_BATCH,
            (events: BroadcastBatchGameEvent[]) => {
                this.emitter.emit(GameServerEvent.BROADCAST_BATCH, events);
            });

        this.gameEventBatcher.emitter.on(GameEventBatcherEvent.PLAYER_BATCH,
            (playerId: EntityId, events: UnicastBatchGameEvent[]) => {
                this.emitter.emit(GameServerEvent.PLAYER_BATCH, playerId, events);
            });

        /**
         * Ticker event handlers
         */
        this.ticker.emitter.on(TickerEvent.TICK,
            (deltaSeconds: number) => {
                this.timeService.decreaseRoundTime(deltaSeconds);
                if (this.timeService.isRoundEnded()) {
                    this.reload();
                }

                this.processPlayersStatus(deltaSeconds);
                processActiveEntitySpawners(this.registry, this.entityFactory);
                processDirection(this.registry);
                this.collisionService.processRequestedDirection();
                processMovement(this.registry, deltaSeconds);
                this.collisionService.processRequestedPosition();
                processDirtyRelativePosition.call(this.pluginContext);
                processAutomaticDestroy(this.registry);
                this.collisionService.processDirtyCollisions();
                this.gameEventBatcher.flush();
            });

        this.gameModeService.setGameMode(gameMode);
        this.gameMapService.loadByName(mapName);
        this.reload();
    }

    processPlayersStatus(deltaSeconds: number) {
        for (const player of
            this.registry.getEntitiesWithComponent(PlayerComponent)) {
            processPlayerRespawnTimeout(player, deltaSeconds);
            processPlayerSpawnStatus.call(this.pluginContext, player);
            const disconnected = processPlayerDisconnectStatus(this.registry,
                player);
            if (disconnected) {
                continue;
            }

            processPlayerMovement(this.registry, player);
            processPlayerShooting(this.registry, player);
            processPlayerDroppingFlag.call(this.pluginContext, player);
        }
    }

    sendRequestedServerStatus(playerId?: EntityId): void {
        const entities = this.registry.getEntities() as Iterable<Entity>;
        const entitiesOptions =
            LazyIterable.from(entities)
                .map(entity => {
                    return {
                        id: entity.id,
                        type: entity.type,
                        subtypes: entity.subtypes,
                        components: entity.getComponentsData({
                            withoutFlags: ComponentFlags.LOCAL_ONLY,
                        }),
                    };
                })
                .toArray() as Iterable<EntityBuildOptions>;

        const configsData = this.config.getDataMultiple([
            'entities-blueprint',
            'game-client',
            'time',
        ]);

        const event: CommonBatchGameEvent = [GameEvent.SERVER_STATUS, {
            entitiesOptions,
            configsData,
        }];

        if (playerId === undefined) {
            this.gameEventBatcher.addBroadcastEvent(event);
        } else {
            this.gameEventBatcher.addPlayerEvent(playerId, event);
        }
    }

    onPlayerAction(playerId: string, action: Action): void {
        const player = this.registry.getEntityById(playerId);

        if (this.timeService.isScoreboardWatchTime()) {
            return;
        }

        if (action.type === ActionType.BUTTON_PRESS) {
            addPlayerButtonPressAction(player, action as ButtonPressAction);
        }
    }

    onPlayerConnected(playerId: string): void {
        this.sendRequestedServerStatus(playerId);

        const player = createPlayer(this.entityFactory, playerId);
        setPlayerRequestedServerStatus(player);
    }

    onPlayerSetName(playerId: string, name: string): void {
        const player = this.registry.getEntityById(playerId);
        setPlayerName(player, name);
    }

    onPlayerRequestSpawnStatus(playerId: string): void {
        const player = this.registry.getEntityById(playerId);
        setPlayerRequestedSpawnStatus(player);
    }

    onPlayerRequestTeam(playerId: string, teamId: string | null): void {
        const player = this.registry.getEntityById(playerId);
        onPlayerRequestedTeam.call(this.pluginContext, player, teamId);
    }

    onPlayerDisconnected(playerId: string): void {
        const player = this.registry.getEntityById(playerId);
        setPlayerRequestedDisconnect(player);
    }

    onPlayerRequestTankColor(playerId: string, color: Color): void {
        const gameModeProperties = this.gameModeService.getGameModeProperties();
        if (gameModeProperties.hasTeams) {
            return;
        }

        const player = this.registry.getEntityById(playerId);
        setPlayerRequestedTankColor(player, color);
    }

    onPlayerRequestTankTier(playerId: string, tier: TankTier): void {
        const player = this.registry.getEntityById(playerId);
        setPlayerRequestedTankTier(player, tier);
    }

    loadMap(gameMap: GameMap): void {
        const entitiesOptions = gameMap.getEntitiesOptions();
        entitiesOptions
            .filter(o => this.gameModeService.isIgnoredEntityType(o.type))
            .forEach(o => this.entityFactory.buildFromOptions(o));
    }

    reload(): void {
        this.ticker.stop();

        destroyAllWorldEntities(this.registry);
        resetPlayers(this.registry);
        this.registryIdGenerator.reset();
        this.gameEventBatcher.flush();

        const gameMap = this.gameMapService.getLoadedMap();
        assert(gameMap !== undefined, 'Cannot reload game without a loaded map');

        this.loadMap(gameMap);

        this.timeService.restartRoundTime();
        this.ticker.start();
    }
}
