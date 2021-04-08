import dotenv from 'dotenv';
dotenv.config();

import Express from 'express';
import Cors from 'cors';
import Http from 'http';
import IO from 'socket.io';
import { BatchGameEvent, GameEvent, UnicastBatchGameEvent } from '@/game/GameEvent';
import { ActionOptions } from '@/actions/Action';
import ActionFactory from '@/actions/ActionFactory';
import GameObject, { GameObjectOptions } from '@/object/GameObject';
import GameServer from '@/game/GameServer';
import Player, { PlayerSpawnStatus } from '@/player/Player';
import yargs from 'yargs';

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
const io = new IO.Server(http, {
    cors: {
        origin: '*',
    },
});
const gameServer = new GameServer();

gameServer.emitter.on(GameEvent.BROADCAST_BATCH, (events: BatchGameEvent[]) => {
    io.emit(GameEvent.BATCH, events);
});
gameServer.emitter.on(GameEvent.PLAYER_BATCH, (playerId: string, events: UnicastBatchGameEvent[]) => {
    io.to(playerId).emit(GameEvent.BATCH, events);
});

io.on('connection', (socket: IO.Socket) => {
    console.log('New user connected', socket.id);
    gameServer.onPlayerConnectedFromClient(socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        gameServer.onPlayerDisconnectedFromClient(socket.id);
    });

    socket.on(GameEvent.PLAYER_ACTION, (options: ActionOptions) => {
        const action = ActionFactory.buildFromOptions(options);
        gameServer.onPlayerActionFromClient(socket.id, action);
    });

    socket.on(GameEvent.PLAYER_REQUEST_GAME_OBJECTS, () => {
        gameServer.onPlayerRequestedGameObjectsFromClient(socket.id);
    });

    socket.on(GameEvent.PLAYER_REQUEST_PLAYERS, () => {
        gameServer.onPlayerRequestedPlayersFromClient(socket.id);
    });

    socket.on(GameEvent.PLAYER_REQUEST_TANK_SPAWN, () => {
        gameServer.onPlayerRequestSpawnStatusFromClient(socket.id, PlayerSpawnStatus.SPAWN);
    });

    socket.on(GameEvent.PLAYER_REQUEST_TANK_DESPAWN, () => {
        gameServer.onPlayerRequestSpawnStatusFromClient(socket.id, PlayerSpawnStatus.DESPAWN);
    });

    socket.on(GameEvent.PLAYER_REQUEST_TANK_COLOR, (r, g, b) => {
        gameServer.onPlayerRequestTankColorFromClient(socket.id, [r, g, b]);
    });

    socket.on(GameEvent.PLAYER_REQUEST_TANK_TIER, tier => {
        gameServer.onPlayerRequestTankTierFromClient(socket.id, tier);
    });
});

http.listen(argv.port, argv.host, () => {
    console.log(`Game server listening on ${argv.host}:${argv.port}`);
});

app.use(Cors());
app.use(Express.static('./assets'));

gameServer.ticker.start();
