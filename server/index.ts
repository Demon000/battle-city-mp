import dotenv from 'dotenv';
dotenv.config();

import Express from 'express';
import Cors from 'cors';
import Http from 'http';
import { Socket, Server } from 'socket.io';
import { BatchGameEvent, GameEvent, UnicastBatchGameEvent } from '@/game/GameEvent';
import { ActionOptions } from '@/actions/Action';
import ActionFactory from '@/actions/ActionFactory';
import GameServer from '@/game/GameServer';
import { PlayerSpawnStatus } from '@/player/Player';
import yargs from 'yargs';
import { GameSocketEvent } from '@/game/GameSocketEvent';
import { Color } from '@/drawable/Color';

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
const io = new Server(http, {
    cors: {
        origin: '*',
    },
});
const gameServer = new GameServer();

gameServer.emitter.on(GameEvent.BROADCAST_BATCH, (events: BatchGameEvent[]) => {
    io.emit(GameSocketEvent.BATCH, events);
});
gameServer.emitter.on(GameEvent.PLAYER_BATCH, (playerId: string, events: UnicastBatchGameEvent[]) => {
    io.to(playerId).emit(GameSocketEvent.BATCH, events);
});

io.on('connection', (socket: Socket) => {
    console.log('New user connected', socket.id);
    gameServer.onPlayerConnectedFromClient(socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        gameServer.onPlayerDisconnectedFromClient(socket.id);
    });

    socket.on(GameSocketEvent.PLAYER_ACTION, (options: ActionOptions) => {
        const action = ActionFactory.buildFromOptions(options);
        gameServer.onPlayerActionFromClient(socket.id, action);
    });

    socket.on(GameSocketEvent.PLAYER_REQUEST_SERVER_STATUS, () => {
        gameServer.onPlayerRequestedServerStatusFromClient(socket.id);
    });

    socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_SPAWN, () => {
        gameServer.onPlayerRequestSpawnStatusFromClient(socket.id, PlayerSpawnStatus.SPAWN);
    });

    socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_DESPAWN, () => {
        gameServer.onPlayerRequestSpawnStatusFromClient(socket.id, PlayerSpawnStatus.DESPAWN);
    });

    socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_COLOR, (color: Color) => {
        gameServer.onPlayerRequestTankColorFromClient(socket.id, color);
    });

    socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_TIER, tier => {
        gameServer.onPlayerRequestTankTierFromClient(socket.id, tier);
    });

    socket.on(GameSocketEvent.PLAYER_SET_NAME, name => {
        gameServer.onPlayerSetName(socket.id, name);
    });

    socket.on(GameSocketEvent.PLAYER_MAP_EDITOR_CREATE_OBJECTS, objectsOptions => {
        gameServer.onPlayerMapEditorCreateObjects(objectsOptions);
    });

    socket.on(GameSocketEvent.PLAYER_MAP_EDITOR_DESTROY_OBJECTS, destroyBox => {
        gameServer.onPlayerMapEditorDestroyObjects(destroyBox);
    });

    socket.on(GameSocketEvent.PLAYER_MAP_EDITOR_SAVE, () => {
        gameServer.onPlayerMapEditorSave();
    });
});

http.listen(argv.port, argv.host, () => {
    console.log(`Game server listening on ${argv.host}:${argv.port}`);
});

app.use(Cors());
app.use(Express.static('./assets'));

gameServer.ticker.start();
