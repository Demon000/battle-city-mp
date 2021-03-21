import Express from 'express';
import Http from 'http';
import IO from 'socket.io';
import { GameEvent } from '@/common/game/GameEvent';

import { ActionOptions } from '@/common/actions/Action';
import ActionFactory from '@/common/actions/ActionFactory';
import GameObject, { GameObjectOptions } from '@/common/object/GameObject';
import GameServer from '@/common/game/GameServer';
import Player, { PlayerOptions } from '@/common/player/Player';

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
    gameServer.onPlayerConnected(socket.id);

    socket.on('disconnect', () => {
        gameServer.onPlayerDisconnected(socket.id);
    });

    socket.on(GameEvent.PLAYER_ACTION, (options: ActionOptions) => {
        const action = ActionFactory.buildFromOptions(options);
        gameServer.onPlayerAction(socket.id, action);
    });

    socket.on(GameEvent.GET_GAME_OBJECTS, (ack: (objectOptions: GameObjectOptions[]) => void) => {
        const objects = gameServer.getGameObjects();
        const objectOptions = objects.map(o => o.toOptions());
        ack(objectOptions);
    });

    socket.on(GameEvent.GET_PLAYERS, (ack: (playerOptions: PlayerOptions[]) => void) => {
        const players = gameServer.getPlayers();
        const playerOptions = players.map(p => p.toOptions());
        ack(playerOptions);
    });
});

gameServer.emitter.on(GameEvent.OBJECT_REGISTERED, (object: GameObject) => {
    io.emit(GameEvent.OBJECT_REGISTERED, object.toOptions());
});
gameServer.emitter.on(GameEvent.OBJECT_CHANGED, (object: GameObject) => {
    io.emit(GameEvent.OBJECT_CHANGED, object);
});
gameServer.emitter.on(GameEvent.OBJECT_UNREGISTERED, (objectId: number) => {
    io.emit(GameEvent.OBJECT_UNREGISTERED, objectId);
});

gameServer.emitter.on(GameEvent.PLAYER_ADDED, (player: Player) => {
    io.emit(GameEvent.PLAYER_ADDED, player.toOptions());
});
gameServer.emitter.on(GameEvent.PLAYER_CHANGED, (player: Player) => {
    io.emit(GameEvent.PLAYER_CHANGED, player.toOptions());
});
gameServer.emitter.on(GameEvent.PLAYER_REMOVED, (playerId: string) => {
    io.emit(GameEvent.PLAYER_REMOVED, playerId);
});

http.listen(3000, () => {
    console.log('Game server listening on port 3030');
});

gameServer.start();
