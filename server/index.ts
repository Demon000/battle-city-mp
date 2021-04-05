import Express from 'express';
import Cors from 'cors';
import Http from 'http';
import IO from 'socket.io';
import dotenv from 'dotenv';
import { GameEvent } from '@/game/GameEvent';
import { ActionOptions } from '@/actions/Action';
import ActionFactory from '@/actions/ActionFactory';
import GameObject, { GameObjectOptions } from '@/object/GameObject';
import GameServer from '@/game/GameServer';
import Player from '@/player/Player';
import yargs from 'yargs';

dotenv.config();

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
        gameServer.onPlayerRequestSpawnStatusFromClient(socket.id);
    });
});

gameServer.emitter.on(GameEvent.OBJECT_REGISTERED, (object: GameObject) => {
    io.emit(GameEvent.OBJECT_REGISTERED, object.toOptions());
});
gameServer.emitter.on(GameEvent.PLAYER_OBJECTS_REGISTERD, (playerId: string, objects: GameObject[]) => {
    const objectOptions = objects.map(o => o.toOptions());
    io.to(playerId).emit(GameEvent.OBJECTS_REGISTERD, objectOptions);
});
gameServer.emitter.on(GameEvent.OBJECT_CHANGED, (objectId: number, objectOptions: GameObjectOptions) => {
    io.emit(GameEvent.OBJECT_CHANGED, objectId, objectOptions);
});
gameServer.emitter.on(GameEvent.OBJECT_UNREGISTERED, (objectId: number) => {
    io.emit(GameEvent.OBJECT_UNREGISTERED, objectId);
});

gameServer.emitter.on(GameEvent.PLAYER_ADDED, (player: Player) => {
    io.emit(GameEvent.PLAYER_ADDED, player.toOptions());
});
gameServer.emitter.on(GameEvent.PLAYER_PLAYERS_ADDED, (playerId: string, players: Player[]) => {
    const playerOptions = players.map(p => p.toOptions());
    io.to(playerId).emit(GameEvent.PLAYERS_ADDED, playerOptions);
});
gameServer.emitter.on(GameEvent.PLAYER_CHANGED, (player: Player) => {
    io.emit(GameEvent.PLAYER_CHANGED, player.toOptions());
});
gameServer.emitter.on(GameEvent.PLAYER_REMOVED, (playerId: string) => {
    io.emit(GameEvent.PLAYER_REMOVED, playerId);
});

http.listen(argv.port, argv.host, () => {
    console.log(`Game server listening on ${argv.host}:${argv.port}`);
});

app.use(Cors());
app.use(Express.static('./assets'));

gameServer.ticker.start();
