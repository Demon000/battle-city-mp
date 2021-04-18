import Action from '@/actions/Action';
import GameObjectProperties from '@/object/GameObjectProperties';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import { TankTier } from '@/tank/TankTier';
import { Socket } from 'socket.io-client';
import { GameObjectOptions } from '../object/GameObject';
import GameObjectFactory from '../object/GameObjectFactory';
import Player, { PlayerOptions } from '../player/Player';
import GameClient, { GameClientEvent } from './GameClient';
import { BatchGameEvent, GameEvent } from './GameEvent';
import { GameServerStatus } from './GameServerStatus';

export default class GameClientSocket {
    socket;
    gameClient;
    initialized = false;

    constructor(socket: Socket, gameClient: GameClient) {
        this.socket = socket;
        this.gameClient = gameClient;

        this.socket.on(GameEvent.BATCH,
            this.onBatch.bind(this));

        this.socket.on('connect', () => {
            this.gameClient.ticker.start();
            console.log('Connected');
        });

        this.socket.on('disconnect', () => {
            this.gameClient.ticker.stop();
        });

        this.gameClient.emitter.on(GameClientEvent.MAP_EDITOR_CREATE_OBJECTS,
            (objectsOptions: GameObjectProperties[]) => {
                this.socket.emit(GameEvent.PLAYER_MAP_EDITOR_CREATE_OBJECTS, objectsOptions);
            });

        this.gameClient.emitter.on(GameClientEvent.MAP_EDITOR_DESTROY_OBJECTS,
            (destroyBox: BoundingBox) => {
                this.socket.emit(GameEvent.PLAYER_MAP_EDITOR_DESTROY_OBJECTS, destroyBox);
            });

        this.socket.connect();
    }

    createPlayer(playerOptions: PlayerOptions): Player {
        const player = new Player(playerOptions);
        if (player.id === this.socket.id) {
            player.isOwnPlayer = true;
        }
        return player;
    }

    onServerStatus(serverStatus: GameServerStatus): void {
        this.gameClient.clear();
        const players = serverStatus.playersOptions.map(o => this.createPlayer(o));
        this.gameClient.onPlayersAddedOnServer(players);
        const objects = serverStatus.objectsOptions.map(o => GameObjectFactory.buildFromOptions(o));
        this.gameClient.onObjectsRegisteredOnServer(objects);
    }

    onPlayerAdded(playerOptions: PlayerOptions): void {
        const player = this.createPlayer(playerOptions);
        this.gameClient.onPlayerAddedOnServer(player);
    }

    onPlayerChanged(playerOptions: PlayerOptions): void {
        const player = this.createPlayer(playerOptions);
        this.gameClient.onPlayerChangedOnServer(player);
    }

    onPlayerRemoved(playerId: string): void {
        this.gameClient.onPlayerRemovedOnServer(playerId);
    }

    onObjectRegistered(objectOptions: GameObjectOptions): void {
        const object = GameObjectFactory.buildFromOptions(objectOptions);
        this.gameClient.onObjectRegisteredOnServer(object);
    }

    onObjectChanged(objectId: number, objectOptions: GameObjectOptions): void {
        this.gameClient.onObjectChangedOnServer(objectId, objectOptions);
    }

    onObjectUnregistered(objectId: number): void {
        this.gameClient.onObjectUnregisteredOnServer(objectId);
    }

    onEvent(batch: BatchGameEvent): void {
        switch (batch[0]) {
            case GameEvent.SERVER_STATUS:
                this.onServerStatus(batch[1]);
                break;
            case GameEvent.PLAYER_ADDED:
                this.onPlayerAdded(batch[1]);
                break;
            case GameEvent.PLAYER_CHANGED:
                this.onPlayerChanged(batch[1]);
                break;
            case GameEvent.PLAYER_REMOVED:
                this.onPlayerRemoved(batch[1]);
                break;
            case GameEvent.OBJECT_REGISTERED:
                this.onObjectRegistered(batch[1]);
                break;
            case GameEvent.OBJECT_CHANGED:
                this.onObjectChanged(batch[1], batch[2]);
                break;
            case GameEvent.OBJECT_UNREGISTERED:
                this.onObjectUnregistered(batch[1]);
                break;
            default:
                throw new Error('Invalid event');
        }
    }

    onBatch(events: any[]): void {
        events.forEach(this.onEvent, this);
    }

    requestPlayerTankSpawn(): void {
        this.socket.emit(GameEvent.PLAYER_REQUEST_TANK_SPAWN);
    }

    requestPlayerTankColor(r: number, g: number, b: number): void {
        this.socket.emit(GameEvent.PLAYER_REQUEST_TANK_COLOR, r, g, b);
    }

    requestPlayerTankDespawn(): void {
        this.socket.emit(GameEvent.PLAYER_REQUEST_TANK_DESPAWN);
    }

    requestPlayerTankTier(tier: TankTier): void {
        this.socket.emit(GameEvent.PLAYER_REQUEST_TANK_TIER, tier);
    }

    requestPlayerAction(action: Action): void {
        this.socket.emit(GameEvent.PLAYER_ACTION, action.toOptions());
    }

    setPlayerName(name: string): void {
        this.socket.emit(GameEvent.PLAYER_SET_NAME, name);
    }
}
