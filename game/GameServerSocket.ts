import { ActionOptions } from '@/actions/Action';
import { ActionFactory } from '@/actions/ActionFactory';
import { PlayerSpawnStatus } from '@/components/PlayerComponent';
import { Color } from '@/drawable/Color';
import { EntityId } from '@/ecs/EntityId';
import { Server, Socket } from 'socket.io';
import { BatchGameEvent, UnicastBatchGameEvent } from './GameEvent';
import { GameServer, GameServerEvent } from './GameServer';
import { GameSocketEvent } from './GameSocketEvent';

export class GameServerSocket {
    private gameServer;
    private socketServer;

    constructor(gameServer: GameServer, socketServer: Server) {
        this.gameServer = gameServer;
        this.socketServer = socketServer;

        gameServer.emitter.on(GameServerEvent.BROADCAST_BATCH,
            (events: BatchGameEvent[]) => {
                this.socketServer.emit(GameSocketEvent.BATCH, events);
            });

        gameServer.emitter.on(GameServerEvent.PLAYER_BATCH,
            (playerId: EntityId, events: UnicastBatchGameEvent[]) => {
                this.socketServer.to(playerId).emit(GameSocketEvent.BATCH, events);
            });

        this.socketServer.on('connection',
            this.onConnection.bind(this));
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

        socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_SPAWN, () => {
            this.gameServer.onPlayerRequestSpawnStatus(socket.id, PlayerSpawnStatus.SPAWN);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_COLOR, (color: Color) => {
            this.gameServer.onPlayerRequestTankColor(socket.id, color);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_TANK_TIER, tier => {
            this.gameServer.onPlayerRequestTankTier(socket.id, tier);
        });

        socket.on(GameSocketEvent.PLAYER_REQUEST_TEAM, teamId => {
            this.gameServer.onPlayerRequestTeam(socket.id, teamId);
        });

        socket.on(GameSocketEvent.PLAYER_SET_NAME, name => {
            this.gameServer.onPlayerSetName(socket.id, name);
        });
    }
}