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
import { BoundingBoxRepository } from '../physics/bounding-box/BoundingBoxRepository';
import { CollisionService } from '../physics/collisions/CollisionService';
import { BroadcastBatchGameEvent, CommonBatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import { GameEventBatcher, GameEventBatcherEvent } from './GameEventBatcher';
import { Registry } from '@/ecs/Registry';
import { RegistryNumberIdGenerator } from '@/ecs/RegistryNumberIdGenerator';
import { BlueprintEnv, EntityBlueprint } from '@/ecs/EntityBlueprint';
import { Config } from '@/config/Config';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { processActiveEntitySpawners } from '@/logic/entity-spawner';
import { processDirection, processMovement } from '@/logic/entity-movement';
import { destroyAllWorldEntities, processAutomaticDestroy } from '@/logic/entity-destroy';
import { addPlayerButtonPressAction, createPlayer, onPlayerRequestedTeam, processPlayerDisconnectStatus, processPlayerDroppingFlag, processPlayerMovement, processPlayerRespawnTimeout, processPlayerShooting, processPlayerSpawnStatus, resetPlayers, setPlayerName, setPlayerRequestedDisconnect, setPlayerRequestedServerStatus, setPlayerRequestedSpawnStatus, setPlayerRequestedTankColor, setPlayerRequestedTankTier } from '@/logic/player';
import { PlayerComponent } from '@/components/PlayerComponent';
import { EntityId } from '@/ecs/EntityId';
import { processDirtyRelativePosition } from '@/logic/entity-relative-position';
import { gameServerEventHandlers } from './GameServerEventHandlers';
import { registerEventHandler } from './EventHandler';
import { isIgnoredEntityType, setGameMode } from '@/logic/game-mode';
import { GameModeTypes } from '@/components/GameModeComponent';
import { getMapEntitiesOptions } from '@/logic/map';
import { EntityType } from '@/entity/EntityType';
import { createTime, isRoundEnded, isScoreboardWatchTime, processTime } from '@/logic/time';

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
    private entityBlueprint;
    private entityFactory;
    private collisionService;
    private gameEventBatcher;
    private pluginContext;
    private gameMode;
    private mapName;
    ticker;

    emitter = new EventEmitter<GameServerEvents>();

    constructor(mapName: string, gameMode: string) {
        this.mapName = mapName;
        this.gameMode = gameMode;

        this.config = new Config();
        this.config.loadDir('./configs');

        const componentRegistry = new ComponentLookupTable();
        this.entityBlueprint = new EntityBlueprint(this.config, BlueprintEnv.SERVER, true);

        this.registryIdGenerator = new RegistryNumberIdGenerator();
        this.registry = new Registry(componentRegistry, this.registryIdGenerator);
        this.entityFactory = new EntityFactory(this.registry, this.entityBlueprint);

        const boundingBoxRepository = new BoundingBoxRepository<string>();

        this.collisionService = new CollisionService(boundingBoxRepository, this.registry);
        this.gameEventBatcher = new GameEventBatcher();

        const ticksPerSecond = this.config.get<number>('game-server', 'ticksPerSecond');
        this.ticker = new Ticker(ticksPerSecond);

        this.pluginContext = {
            batcher: this.gameEventBatcher,
            registry: this.registry,
            entityFactory: this.entityFactory,
            collisionService: this.collisionService,
        };

        for (const handler of gameServerEventHandlers) {
            registerEventHandler(this.pluginContext, handler);
        }

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
                processTime(this.registry, deltaSeconds);
                if (isRoundEnded(this.registry)) {
                    this.reload();
                }

                if (isScoreboardWatchTime(this.registry)) {
                    this.gameEventBatcher.flush();
                    return;
                }

                this.processPlayersStatus(deltaSeconds);
                processActiveEntitySpawners(this.registry, this.entityFactory);
                processDirection(this.registry);
                this.collisionService.processRequestedDirection();
                processMovement(this.registry, deltaSeconds);
                this.collisionService.processRequestedPosition();
                processDirtyRelativePosition(this.registry);
                processAutomaticDestroy(this.registry);
                this.collisionService.processDirtyCollisions();
                this.collisionService.processDirtyCollisionTracking();
                this.gameEventBatcher.flush();
            });

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
        onPlayerRequestedTeam(this.registry, player, teamId);
    }

    onPlayerDisconnected(playerId: string): void {
        const player = this.registry.getEntityById(playerId);
        setPlayerRequestedDisconnect(player);
    }

    onPlayerRequestTankColor(playerId: string, color: Color): void {
        const player = this.registry.getEntityById(playerId);
        setPlayerRequestedTankColor(player, color);
    }

    onPlayerRequestTankTier(playerId: string, tier: TankTier): void {
        const player = this.registry.getEntityById(playerId);
        setPlayerRequestedTankTier(player, tier);
    }

    reload(): void {
        this.ticker.stop();

        destroyAllWorldEntities(this.registry);
        resetPlayers(this.registry);
        this.registryIdGenerator.reset();
        this.gameEventBatcher.flush();

        setGameMode(this.entityFactory, this.gameMode as GameModeTypes);

        const entityBuildOptions = getMapEntitiesOptions(this.entityBlueprint,
            this.mapName);
        entityBuildOptions
            .filter(o => !isIgnoredEntityType(this.registry, o.type as EntityType))
            .forEach(o => this.entityFactory.buildFromOptions(o));

        createTime(this.entityFactory);

        this.ticker.start();
    }
}
