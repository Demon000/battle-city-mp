import { Config } from '@/config/Config';
import EventEmitter from 'eventemitter3';

export enum TimeServiceEvent {
    ROUND_TIME_UPDATED = 'round-time-updated',
    MAP_VOTE_TIME = 'map-vote-time',
    SCOREBOARD_WATCH_TIME = 'scoreboard-watch-time',
}

export interface TimeServiceEvents {
    [TimeServiceEvent.ROUND_TIME_UPDATED]: (roundTime: number) => void,
    [TimeServiceEvent.MAP_VOTE_TIME]: (value: boolean) => void,
    [TimeServiceEvent.SCOREBOARD_WATCH_TIME]: (value: boolean) => void,
}

export class TimeService {
    private currentTime = 0;
    private mapVotePassed = false;
    private scoreboardWatchPassed = false;

    emitter = new EventEmitter<TimeServiceEvents>();

    constructor(
        private config: Config,
    ) {}

    setMapVotePassed(value: boolean): void {
        this.mapVotePassed = value;
        this.emitter.emit(TimeServiceEvent.MAP_VOTE_TIME, value);
    }

    setScoreboardWatchPassed(value: boolean): void {
        this.scoreboardWatchPassed = value;
        this.emitter.emit(TimeServiceEvent.SCOREBOARD_WATCH_TIME, value);
    }

    setRoundTime(roundSeconds: number): void {
        const lastRoundSeconds = Math.floor(this.currentTime);
        this.currentTime = roundSeconds;
        const newRoundSeconds = Math.floor(this.currentTime);

        if (lastRoundSeconds === newRoundSeconds) {
            return;
        }

        this.emitter.emit(TimeServiceEvent.ROUND_TIME_UPDATED, newRoundSeconds);

        const mapVoteSeconds = this.config.get<number>('time', 'mapVoteSeconds');
        if (newRoundSeconds <= mapVoteSeconds && !this.mapVotePassed) {
            this.setMapVotePassed(true);
        }

        const scoreboardWatchSeconds = this.config.get<number>('time', 'scoreboardWatchSeconds');
        if (newRoundSeconds <= scoreboardWatchSeconds && !this.scoreboardWatchPassed) {
            this.setScoreboardWatchPassed(true);
        }
    }

    restartRoundTime(): void {
        const roundTimeSeconds = this.config.get<number>('time', 'roundTimeSeconds');
        this.setRoundTime(roundTimeSeconds);
        this.setMapVotePassed(false);
        this.setScoreboardWatchPassed(false);
    }

    decreaseRoundTime(deltaSeconds: number): void {
        this.setRoundTime(this.currentTime - deltaSeconds);
    }

    isRoundEnded(): boolean {
        return this.currentTime <= 0;
    }
}
