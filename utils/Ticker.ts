import EventEmitter from 'eventemitter3';
import now from 'performance-now';

export enum TickerEvent {
    TICK = 'tick',
}

interface TickerEvents {
    [TickerEvent.TICK]: (deltaSeconds: number) => void,
}

export default class Ticker {
    tickTime?: number;
    lastTickTime = 0;
    deltaSeconds = 0;
    running = false;
    emitter = new EventEmitter<TickerEvents>();
    useRequestAnimationFrame;

    constructor(tickRate?: number) {
        if (tickRate === undefined) {
            this.useRequestAnimationFrame = true;
        } else {
            this.tickTime = 1000 / tickRate;
        }
    }

    tick(currentTickTime: number): void {
        if (this.lastTickTime) {
            const deltaSeconds = (currentTickTime - this.lastTickTime) / 1000;
            this.emitter.emit(TickerEvent.TICK, deltaSeconds);
        }

        this.lastTickTime = currentTickTime;

        if (!this.running) {
            return;
        }

        this.callTick();
    }

    callTick(): void {
        if (this.useRequestAnimationFrame) {
            requestAnimationFrame((currentTickTime) => {
                this.tick(currentTickTime);
            });
        } else {
            setTimeout(() => {
                const currentTickTime = now();
                this.tick(currentTickTime);
            }, this.tickTime);
        }
    }

    start(): void {
        if (this.running) {
            return;
        }

        this.running = true;
        this.callTick();
    }

    stop(): void {
        this.running = false;
    }
}
