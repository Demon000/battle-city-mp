import dotenv from 'dotenv';
dotenv.config();

import Express from 'express';
import Cors from 'cors';
import Http from 'http';
import { Server } from 'socket.io';
import { GameServer } from '@/game/GameServer';
import yargs from 'yargs';
import { GameServerSocket } from '@/game/GameServerSocket';

const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .options('host', {
        alias: 'h',
        type: 'string',
        default: '0.0.0.0',
        description: 'specify host',
    })
    .options('port', {
        alias: 'p',
        type: 'number',
        default: 5000,
        description: 'specify port',
    })
    .argv;

const app = Express();
const http = new Http.Server(app);
const serverSocket = new Server(http, {
    cors: {
        origin: '*',
    },
});
const gameServer = new GameServer();
new GameServerSocket(gameServer, serverSocket);
gameServer.ticker.start();

http.listen(argv.port, argv.host, () => {
    console.log(`Game server listening on ${argv.host}:${argv.port}`);
});

app.use(Cors());
app.use(Express.static('./assets'));
