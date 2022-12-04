import { Action } from '@/actions/Action';
import { Color } from '@/drawable/Color';
import { TankTier } from '@/subtypes/TankTier';
import { assert } from '@/utils/assert';
import { Socket } from 'socket.io-client';
import { GameClient, GameClientEvent } from './GameClient';
import { BatchGameEvent, GameEvent } from './GameEvent';
import { GameSocketEvent, GameSocketEvents } from './GameSocketEvent';

export class GameClientSocket {
    socket;
    gameClient;
    initialized = false;
    events: BatchGameEvent[] = [];

    constructor(socket: Socket<GameSocketEvents>, gameClient: GameClient) {
        this.socket = socket;
        this.gameClient = gameClient;

        this.socket.on(GameSocketEvent.BATCH, (events: BatchGameEvent[]) => {
            events.forEach(this.onEvent, this);
        });

        this.socket.on('connect', () => {
            this.gameClient.setOwnPlayerId(this.socket.id);
            this.gameClient.ticker.start();
            console.log('Connected');
        });

        this.socket.on('disconnect', () => {
            this.gameClient.ticker.stop();
        });

        this.gameClient.emitter.on(GameClientEvent.FLUSH_EVENTS, () => {
            this.flushEvents();
        });

        this.socket.connect();
    }

    flushEvent(batch: BatchGameEvent) {
        switch (batch[0]) {
            case GameEvent.SERVER_STATUS:
                this.gameClient.onServerStatus(batch[1]);
                break;
            case GameEvent.PLAYER_ADDED:
                this.gameClient.onPlayerAdded(batch[1]);
                break;
            case GameEvent.PLAYER_CHANGED:
                this.gameClient.onPlayerChanged(batch[1], batch[2]);
                break;
            case GameEvent.PLAYER_REMOVED:
                this.gameClient.onPlayerRemoved(batch[1]);
                break;
            case GameEvent.TEAM_PLAYER_ADDED:
                this.gameClient.onTeamPlayerAdded(batch[1], batch[2]);
                break;
            case GameEvent.TEAM_PLAYER_REMOVED:
                this.gameClient.onTeamPlayerRemoved(batch[1], batch[2]);
                break;
            case GameEvent.ENTITY_REGISTERED:
                this.gameClient.onEntityRegistered(batch[1]);
                break;
            case GameEvent.ENTITY_UNREGISTERED:
                this.gameClient.onEntityUnregistered(batch[1]);
                break;
            case GameEvent.ENTITY_COMPONENT_ADDED:
                this.gameClient.onEntityComponentAdded(batch[1], batch[2], batch[3]);
                break;
            case GameEvent.ENTITY_COMPONENT_UPDATED:
                this.gameClient.onEntityComponentUpdated(batch[1], batch[2], batch[3]);
                break;
            case GameEvent.ENTITY_COMPONENT_REMOVED:
                this.gameClient.onEntityComponentRemoved(batch[1], batch[2]);
                break;
            case GameEvent.ROUND_TIME_UPDATED:
                this.gameClient.onRoundTimeUpdated(batch[1]);
                break;
            default:
                assert(false, `Invalid event '${batch[0]}'`);
        }
    }

    flushEvents(): void {
        for (const event of this.events) {
            this.flushEvent(event);
        }

        this.events = [];
    }

    onEvent(batch: BatchGameEvent): void {
        this.events.push(batch);
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
