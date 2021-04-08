import Action from '@/actions/Action';
import { TankTier } from '@/tank/TankTier';
import { Socket } from 'socket.io-client';
import { GameObjectOptions } from '../object/GameObject';
import GameObjectFactory from '../object/GameObjectFactory';
import Player, { PlayerOptions } from '../player/Player';
import GameClient from './GameClient';
import { GameEvent } from './GameEvent';

export default class GameClientSocket {
    socket;
    gameClient;
    initialized = false;

    constructor(socket: Socket, gameClient: GameClient) {
        this.socket = socket;
        this.gameClient = gameClient;

        this.listen();
    }

    createPlayer(playerOptions: PlayerOptions): Player {
        const player = new Player(playerOptions);
        if (player.id === this.socket.id) {
            player.isOwnPlayer = true;
        }
        return player;
    }

    onPlayersAdded(playerOptions: PlayerOptions[]): void {
        const players = playerOptions.map(o => this.createPlayer(o));
        this.gameClient.onPlayersAddedOnServer(players);
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

    onObjectsRegistered(objectOptions: GameObjectOptions[]): void {
        const objects = objectOptions.map(o => GameObjectFactory.buildFromOptions(o));
        this.gameClient.onObjectsRegisteredOnServer(objects);
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

    onEvent([name, ...args]: any): void {
        switch (name) {
            case GameEvent.PLAYERS_ADDED:
                this.onPlayersAdded(args[0]);
                break;
            case GameEvent.PLAYER_ADDED:
                this.onPlayerAdded(args[0]);
                break;
            case GameEvent.PLAYER_CHANGED:
                this.onPlayerChanged(args[0]);
                break;
            case GameEvent.PLAYER_REMOVED:
                this.onPlayerRemoved(args[0]);
                break;
            case GameEvent.OBJECTS_REGISTERD:
                this.onObjectsRegistered(args[0]);
                break;
            case GameEvent.OBJECT_REGISTERED:
                this.onObjectRegistered(args[0]);
                break;
            case GameEvent.OBJECT_CHANGED:
                this.onObjectChanged(args[0], args[1]);
                break;
            case GameEvent.OBJECT_UNREGISTERED:
                this.onObjectUnregistered(args[0]);
                break;
            default:
                throw new Error('Invalid event');
        }
    }

    onBatch(events: any[]): void {
        events.forEach(this.onEvent, this);
    }

    listen(): void {
        this.socket.on(GameEvent.BATCH,
            this.onBatch.bind(this));

        this.socket.on('connect', () => {
            this.gameClient.ticker.start();
            console.log('Connected');
        });

        this.socket.on('disconnect', () => {
            this.gameClient.ticker.stop();
            this.gameClient.clear();
        });

        this.socket.connect();
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
}
