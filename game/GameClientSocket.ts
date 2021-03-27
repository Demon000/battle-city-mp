import Action from '@/actions/Action';
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

    listen(): void {
        this.socket.on('connect', () => {
            console.log('Connected');
        });

        this.socket.on(GameEvent.OBJECTS_REGISTERD, (objectOptions: GameObjectOptions[]) => {
            const objects = objectOptions.map(o => GameObjectFactory.buildFromOptions(o));
            this.gameClient.onObjectsRegisteredOnServer(objects);
        });

        this.socket.on(GameEvent.PLAYERS_ADDED, (playerOptions: PlayerOptions[]) => {
            const players = playerOptions.map(o => this.createPlayer(o));
            this.gameClient.onPlayersAddedOnServer(players);
        });

        this.socket.on(GameEvent.PLAYER_ADDED, (playerOptions: PlayerOptions) => {
            const player = this.createPlayer(playerOptions);
            this.gameClient.onPlayerAddedOnServer(player);
        });

        this.socket.on(GameEvent.PLAYER_CHANGED, (playerOptions: PlayerOptions) => {
            const player = this.createPlayer(playerOptions);
            this.gameClient.onPlayerChangedOnServer(player);
        });

        this.socket.on(GameEvent.PLAYER_REMOVED, (playerId: string) => {
            this.gameClient.onPlayerRemovedOnServer(playerId);
        });

        this.socket.on(GameEvent.OBJECT_REGISTERED, (objectOptions: GameObjectOptions) => {
            const object = GameObjectFactory.buildFromOptions(objectOptions);
            this.gameClient.onObjectRegisteredOnServer(object);
        });

        this.socket.on(GameEvent.OBJECT_CHANGED, (objectOptions: GameObjectOptions) => {
            const object = GameObjectFactory.buildFromOptions(objectOptions);
            this.gameClient.onObjectChangedOnServer(object);
        });

        this.socket.on(GameEvent.OBJECT_UNREGISTERED, (objectId: number) => {
            this.gameClient.onObjectUnregisteredOnServer(objectId);
        });

        this.socket.emit(GameEvent.PLAYER_REQUEST_GAME_OBJECTS);
        this.socket.emit(GameEvent.PLAYER_REQUEST_PLAYERS);

        this.gameClient.ticker.start();
    }

    requestPlayerTankSpawn(): void {
        this.socket.emit(GameEvent.PLAYER_REQUEST_TANK_SPAWN);
    }

    requestPlayerAction(action: Action): void {
        this.socket.emit(GameEvent.PLAYER_ACTION, action.toOptions());
    }
}
