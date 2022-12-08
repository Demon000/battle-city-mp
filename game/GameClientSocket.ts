import { Action } from '@/actions/Action';
import { Color } from '@/drawable/Color';
import { TankTier } from '@/subtypes/TankTier';
import { Socket } from 'socket.io-client';
import { GameClient } from './GameClient';
import { BatchGameEvent } from './GameEvent';
import { GameSocketEvent, GameSocketEvents } from './GameSocketEvent';

export class GameClientSocket {
    socket;
    gameClient;
    initialized = false;

    constructor(socket: Socket<GameSocketEvents>, gameClient: GameClient) {
        this.socket = socket;
        this.gameClient = gameClient;

        this.socket.on(GameSocketEvent.BATCH, (events: BatchGameEvent[]) => {
            for (const batch of events) {
                this.gameClient.gameEventBatcher.addBroadcastEvent(batch);
            }
        });

        this.socket.on('connect', () => {
            this.gameClient.setOwnPlayerId(this.socket.id);
            this.gameClient.ticker.start();
            console.log('Connected');
        });

        this.socket.on('disconnect', () => {
            this.gameClient.ticker.stop();
        });

        this.socket.connect();
    }

    requestPlayerTankSpawn(): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_SPAWN);
    }

    requestPlayerTankColor(color: Color): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_COLOR, color);
    }

    requestPlayerTankTier(tier: TankTier): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_TIER, tier);
    }

    requestPlayerTeam(teamId: string | null): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TEAM, teamId);
    }

    requestPlayerAction(action: Action): void {
        this.socket.emit(GameSocketEvent.PLAYER_ACTION, action.toOptions());
    }

    setPlayerName(name: string): void {
        this.socket.emit(GameSocketEvent.PLAYER_SET_NAME, name);
    }
}
