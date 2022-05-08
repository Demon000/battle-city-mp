import EventEmitter from 'eventemitter3';
import { BroadcastBatchGameEvent, UnicastBatchGameEvent } from './GameEvent';

export enum GameEventBatcherEvent {
    PLAYER_BATCH = 'p',
    BROADCAST_BATCH = 'b',
}

export interface GameEventBatcherEvents {
    [GameEventBatcherEvent.PLAYER_BATCH]: (playerId: string, events: UnicastBatchGameEvent[]) => void;
    [GameEventBatcherEvent.BROADCAST_BATCH]: (events: BroadcastBatchGameEvent[]) => void;
}

export class GameEventBatcher {
    broadcastEvents = new Array<BroadcastBatchGameEvent>();
    playersEvents = new Map<string, UnicastBatchGameEvent[]>();
    emitter = new EventEmitter<GameEventBatcherEvents>();

    addPlayerEvent(playerId: string, event: UnicastBatchGameEvent): void {
        let playerEvents = this.playersEvents.get(playerId);
        if (playerEvents === undefined) {
            playerEvents = new Array<UnicastBatchGameEvent>();
            this.playersEvents.set(playerId, playerEvents);
        }

        playerEvents.push(event);
    }

    addBroadcastEvent(event: BroadcastBatchGameEvent): void {
        this.broadcastEvents.push(event);
    }

    flushPlayerEvents(events: UnicastBatchGameEvent[], playerId: string): void {
        if (events.length === 0) {
            return;
        }

        this.emitter.emit(GameEventBatcherEvent.PLAYER_BATCH, playerId, events);
    }

    flushPlayersEvents(): void {
        this.playersEvents.forEach(this.flushPlayerEvents, this);
        this.playersEvents.clear();
    }

    flushBroadcastEvents(): void {
        if (this.broadcastEvents.length === 0) {
            return;
        }

        this.emitter.emit(GameEventBatcherEvent.BROADCAST_BATCH, this.broadcastEvents);
        this.broadcastEvents.length = 0;
    }

    flush(): void {
        this.flushPlayersEvents();
        this.flushBroadcastEvents();
    }
}
