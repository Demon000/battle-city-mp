import { io, Socket } from 'socket.io-client';
import GameClient from './GameClient';

export default class GameClientSocket {
    gameClient: GameClient | undefined;
    socket: Socket | undefined;

    constructor(serverUrl: string) {
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Connected');
        });
    }
}
