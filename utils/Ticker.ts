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
    lastRequestId?: number;
    lastTickTime = 0;
    currentTickTime = 0;
    deltaSeconds = 0;
    running = false;
    emitter = new EventEmitter<TickerEvents>();
    useRequestAnimationFrame;
    timeoutWrapper: () => void;
    requestAnimationFrameWrapper: (currentTickTime: number) => void;
    callTick: () => void;
    tick: () => void;

    constructor(tickRate?: number) {
        if (tickRate === undefined) {
            this.useRequestAnimationFrame = true;
            this.callTick = this.callRequestAnimationFrame;
        } else {
            this.tickTime = 1000 / tickRate;
            this.callTick = this.callSetTimeout;
        }

        this.timeoutWrapper = this._timeoutWrapper.bind(this);
        this.requestAnimationFrameWrapper = this._requestAnimationFrameWrapper.bind(this);
        this.tick = this._tick.bind(this);
    }

    _tick(): void {
        if (this.lastTickTime) {
            const deltaSeconds = (this.currentTickTime - this.lastTickTime) / 1000;
            this.emitter.emit(TickerEvent.TICK, deltaSeconds);
        }

        this.lastTickTime = this.currentTickTime;

        if (!this.running) {
            return;
        }

        this.callTick();
    }

    _requestAnimationFrameWrapper(currentTickTime: number): void {
        this.currentTickTime = currentTickTime;
        setTimeout(this.tick);
    }

    _timeoutWrapper(): void {
        this.currentTickTime = now();
        this.tick();
    }

    callRequestAnimationFrame(): void {
        if (this.lastRequestId !== undefined) {
            cancelAnimationFrame(this.lastRequestId);
        }
        this.lastRequestId = requestAnimationFrame(this.requestAnimationFrameWrapper);
    }

    callSetTimeout(): void {
        setTimeout(this.timeoutWrapper, this.tickTime);
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
