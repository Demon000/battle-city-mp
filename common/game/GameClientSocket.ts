import { io, Socket } from 'socket.io-client';
import { GameObjectOptions } from '../object/GameObject';
import GameObjectFactory from '../object/GameObjectFactory';
import Player, { PlayerOptions } from '../player/Player';
import GameClient from './GameClient';
import { GameEvent } from './GameEvent';

export default class GameClientSocket {
    gameClient?: GameClient;
    socket?: Socket;

    constructor(serverUrl: string) {
        this.gameClient = new GameClient();
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Connected');
        });

        this.socket.emit(GameEvent.GET_GAME_OBJECTS, (objectOptions: GameObjectOptions[]) => {
            const objects = objectOptions.map(o => GameObjectFactory.buildFromOptions(o));
            this.gameClient?.registerObjects(objects);
        });

        this.socket.emit(GameEvent.GET_PLAYERS, (playerOptions: PlayerOptions[]) => {
            const players = playerOptions.map(p => new Player(p));
            this.gameClient?.addPlayers(players);
        });
    }
}
