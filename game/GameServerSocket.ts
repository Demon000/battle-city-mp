import { ActionOptions } from '@/actions/Action';
import ActionFactory from '@/actions/ActionFactory';
import { Color } from '@/drawable/Color';
import { PartialGameObjectOptions } from '@/object/GameObject';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import { PlayerSpawnStatus } from '@/player/Player';
import { Server, Socket } from 'socket.io';
import { BatchGameEvent, GameEvent, UnicastBatchGameEvent } from './GameEvent';
import GameServer from './GameServer';
import { GameSocketEvent } from './GameSocketEvent';

export default class GameServerSocket {
    private gameServer;
    private socketServer;

    constructor(gameServer: GameServer, socketServer: Server) {
        this.gameServer = gameServer;
        this.socketServer = socketServer;

        gameServer.emitter.on(GameEvent.BROADCAST_BATCH,
            (events: BatchGameEvent[]) => {
                this.socketServer.emit(GameSocketEvent.BATCH, events);
            });

        gameServer.emitter.on(GameEvent.PLAYER_BATCH,
            (playerId: string, events: UnicastBatchGameEvent[]) => {
                this.socketServer.to(playerId).emit(GameSocketEvent.BATCH, events);
            });

        this.socketServer.on('connection',
            this.onConnection.bind(this));

        this.gameServer.ticker.start();
    }

    onConnection(socket: Socket): void {
        console.log('New user connected', socket.id);
        this.gameServer.onPlayerConnected(socket.id);

        socket.on('disconnect', () => {
            console.log('User disconnected', socket.id);
            this.gameServer.onPlayerDisconnected(socket.id);
        });

        socket.on(GameSocketEvent.PLAYER_ACTION, (options: ActionOptions) => {
            const action = ActionFactory.buildFromOptions(options);
            this.gameServer.onPlayerAction(socket.id, action);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_SERVER_STATUS, () => {
            this.gameServer.onPlayerRequestedServerStatus(socket.id);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_SPAWN, () => {
            this.gameServer.onPlayerRequestSpawnStatus(socket.id, PlayerSpawnStatus.SPAWN);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_DESPAWN, () => {
            this.gameServer.onPlayerRequestSpawnStatus(socket.id, PlayerSpawnStatus.DESPAWN);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_COLOR, (color: Color) => {
            this.gameServer.onPlayerRequestTankColor(socket.id, color);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_TIER, tier => {
            this.gameServer.onPlayerRequestTankTier(socket.id, tier);
        });

        socket.on(GameSocketEvent.PLAYER_SET_NAME, name => {
            this.gameServer.onPlayerSetName(socket.id, name);
        });

        socket.on(GameSocketEvent.PLAYER_MAP_EDITOR_ENABLE, enabled => {
            this.gameServer.onMapEditorEnable(socket.id, enabled);
        });

        socket.on(GameSocketEvent.PLAYER_MAP_EDITOR_CREATE_OBJECTS,
            (objectsOptions: PartialGameObjectOptions[]) => {
                this.gameServer.onMapEditorCreateObjects(objectsOptions);
            });

        socket.on(GameSocketEvent.PLAYER_MAP_EDITOR_DESTROY_OBJECTS,
            (destroyBox: BoundingBox) => {
                this.gameServer.onMapEditorDestroyObjects(destroyBox);
            });

        socket.on(GameSocketEvent.PLAYER_MAP_EDITOR_SAVE, () => {
            this.gameServer.onMapEditorSave();
        });
    }
}