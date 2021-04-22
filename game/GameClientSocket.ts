import Action from '@/actions/Action';
import GameObjectProperties from '@/object/GameObjectProperties';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import { TankTier } from '@/tank/TankTier';
import { Socket } from 'socket.io-client';
import GameClient, { GameClientEvent } from './GameClient';
import { BatchGameEvent, GameEvent } from './GameEvent';
import { GameSocketEvent, GameSocketEvents } from './GameSocketEvent';

export default class GameClientSocket {
    socket;
    gameClient;
    initialized = false;

    constructor(socket: Socket<GameSocketEvents>, gameClient: GameClient) {
        this.socket = socket;
        this.gameClient = gameClient;

        this.socket.on(GameSocketEvent.BATCH,
            this.onBatch.bind(this));

        this.socket.on('connect', () => {
            this.gameClient.setOwnPlayerId(this.socket.id);
            this.gameClient.ticker.start();
            console.log('Connected');
        });

        this.socket.on('disconnect', () => {
            this.gameClient.ticker.stop();
        });

        this.gameClient.emitter.on(GameClientEvent.MAP_EDITOR_CREATE_OBJECTS,
            (objectsOptions: GameObjectProperties[]) => {
                this.socket.emit(GameSocketEvent.PLAYER_MAP_EDITOR_CREATE_OBJECTS, objectsOptions);
            });

        this.gameClient.emitter.on(GameClientEvent.MAP_EDITOR_DESTROY_OBJECTS,
            (destroyBox: BoundingBox) => {
                this.socket.emit(GameSocketEvent.PLAYER_MAP_EDITOR_DESTROY_OBJECTS, destroyBox);
            });

        this.socket.connect();
    }

    onEvent(batch: BatchGameEvent): void {
        switch (batch[0]) {
            case GameEvent.SERVER_STATUS:
                this.gameClient.onServerStatus(batch[1]);
                break;
            case GameEvent.PLAYER_ADDED:
                this.gameClient.onPlayerAddedOnServer(batch[1]);
                break;
            case GameEvent.PLAYER_CHANGED:
                this.gameClient.onPlayerChangedOnServer(batch[1], batch[2]);
                break;
            case GameEvent.PLAYER_REMOVED:
                this.gameClient.onPlayerRemovedOnServer(batch[1]);
                break;
            case GameEvent.OBJECT_REGISTERED:
                this.gameClient.onObjectRegisteredOnServer(batch[1]);
                break;
            case GameEvent.OBJECT_CHANGED:
                this.gameClient.onObjectChangedOnServer(batch[1], batch[2]);
                break;
            case GameEvent.OBJECT_UNREGISTERED:
                this.gameClient.onObjectUnregisteredOnServer(batch[1]);
                break;
            default:
                throw new Error('Invalid event');
        }
    }

    onBatch(events: BatchGameEvent[]): void {
        events.forEach(this.onEvent, this);
    }

    requestPlayerTankSpawn(): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_SPAWN);
    }

    requestPlayerTankColor(r: number, g: number, b: number): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_COLOR, [r, g, b]);
    }

    requestPlayerTankDespawn(): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_DESPAWN);
    }

    requestPlayerTankTier(tier: TankTier): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_TIER, tier);
    }

    requestPlayerAction(action: Action): void {
        this.socket.emit(GameSocketEvent.PLAYER_ACTION, action.toOptions());
    }

    setPlayerName(name: string): void {
        this.socket.emit(GameSocketEvent.PLAYER_SET_NAME, name);
    }

    saveMap(): void {
        this.socket.emit(GameSocketEvent.PLAYER_MAP_EDITOR_SAVE);
    }
}
