import { io, Socket } from 'socket.io-client';
import { GameObjectOptions } from '../object/GameObject';
import GameObjectFactory from '../object/GameObjectFactory';
import Player, { PlayerOptions } from '../player/Player';
import GameClient from './GameClient';
import { GameEvent } from './GameEvent';

export default class GameClientSocket {
    gameClient;
    socket;

    constructor(serverUrl: string, gameClient: GameClient) {
        this.gameClient = gameClient;
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Connected');
        });

        this.socket.on(GameEvent.OBJECT_REGISTERED, (objectOptions: GameObjectOptions) => {
            const object = GameObjectFactory.buildFromOptions(objectOptions);
            this.gameClient.onObjectRegisteredOnServer(object);
        });

        this.socket.on(GameEvent.PLAYER_ADDED, (playerOptions: PlayerOptions) => {
            const player = new Player(playerOptions);
            this.gameClient.onPlayerAddedOnServer(player);
        });

        this.socket.on(GameEvent.PLAYER_CHANGED, (playerOptions: PlayerOptions) => {
            const player = new Player(playerOptions);
            this.gameClient.onPlayerChangedOnServer(player);
        });

        this.socket.on(GameEvent.PLAYER_REMOVED, (playerId: string) => {
            this.gameClient.onPlayerRemovedOnServer(playerId);
        });

        this.socket.emit(GameEvent.GET_GAME_OBJECTS, (objectOptions: GameObjectOptions[]) => {
            const objects = objectOptions.map(o => GameObjectFactory.buildFromOptions(o));
            this.gameClient.onObjectsRegisteredOnServer(objects);
        });

        this.socket.emit(GameEvent.GET_PLAYERS, (playerOptions: PlayerOptions[]) => {
            const players = playerOptions.map(p => new Player(p));
            this.gameClient.onPlayersAddedOnServer(players);
        });
    }
}
