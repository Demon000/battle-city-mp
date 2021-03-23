import EventEmitter from 'eventemitter3';
import now from 'performance-now';

export enum TickerEvent {
    TICK = 'tick',
}

export default class Ticker {
    tickRate: number;
    tickTime: number;
    lastTickTime = 0;
    deltaSeconds = 0;
    running = true;
    emitter = new EventEmitter();

    constructor(tickRate: number) {
        this.tickRate = tickRate;
        this.tickTime = 1000 / tickRate;
    }

    tick(): void {
        const currentTickTime = now();

        if (this.lastTickTime) {
            const deltaSeconds = (currentTickTime - this.lastTickTime) / 1000;
            this.emitter.emit(TickerEvent.TICK, deltaSeconds);
        }

        this.lastTickTime = currentTickTime;

        if (!this.running) {
            return;
        }

        setTimeout(this.tick.bind(this), this.tickTime);
    }

    start(): void {
        this.running = true;

        this.tick();
    }

    stop(): void {
        this.running = false;
    }
}
