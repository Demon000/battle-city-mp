import { Config } from '@/config/Config';
import EventEmitter from 'eventemitter3';

export enum TimeServiceEvent {
    ROUND_TIME_UPDATED = 'round-time-updated',
}

export interface TimeServiceEvents {
    [TimeServiceEvent.ROUND_TIME_UPDATED]: (roundTime: number) => void,
}

export class TimeService {
    private currentTime = 0;

    emitter = new EventEmitter<TimeServiceEvents>();

    constructor(
        private config: Config,
    ) {}

    setRoundTime(roundSeconds: number): void {
        const lastRoundSeconds = Math.floor(this.currentTime);
        this.currentTime = roundSeconds;
        const newRoundSeconds = Math.floor(this.currentTime);

        if (lastRoundSeconds === newRoundSeconds) {
            return;
        }

        this.emitter.emit(TimeServiceEvent.ROUND_TIME_UPDATED, newRoundSeconds);
    }

    restartRoundTime(): void {
        const roundTimeSeconds = this.config.get<number>('time', 'roundTimeSeconds');
        this.setRoundTime(roundTimeSeconds);
    }

    isVotingTime(): boolean {
        const roundVoteSeconds = this.config.get<number>('time', 'mapVoteSeconds');
        return this.currentTime <= roundVoteSeconds;
    }

    isScoreboardWatchTime(): boolean {
        const scoreboardWatchSeconds = this.config.get<number>('time', 'scoreboardWatchSeconds');
        return this.currentTime <= scoreboardWatchSeconds;
    }

    decreaseRoundTime(deltaSeconds: number): void {
        this.setRoundTime(this.currentTime - deltaSeconds);
    }
}
