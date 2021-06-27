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
    private roundTime = 0;
    private roundSeconds = 0;
    private mapVotePassed = false;
    private scoreboardWatchPassed = false;

    emitter = new EventEmitter<TimeServiceEvents>();

    constructor(
        private config: Config,
    ) {}

    setMapVotePassed(value: boolean): void {
        if (this.mapVotePassed === value) {
            return;
        }

        this.mapVotePassed = value;
        this.emitter.emit(TimeServiceEvent.MAP_VOTE_TIME, value);
    }

    setScoreboardWatchPassed(value: boolean): void {
        if (this.scoreboardWatchPassed === value) {
            return;
        }

        this.scoreboardWatchPassed = value;
        this.emitter.emit(TimeServiceEvent.SCOREBOARD_WATCH_TIME, value);
    }

    setRoundSeconds(roundSeconds: number): void {
        if (this.roundSeconds === roundSeconds) {
            return;
        }

        this.roundSeconds = roundSeconds;
        this.emitter.emit(TimeServiceEvent.ROUND_TIME_UPDATED, roundSeconds);
    }

    setRoundTime(roundTime: number): void {
        const roundSeconds = Math.floor(roundTime);
        this.setRoundSeconds(roundSeconds);

        this.roundTime = roundTime;

        this.setMapVotePassed(this.isMapVoteTime());
        this.setScoreboardWatchPassed(this.isScoreboardWatchTime());
    }

    restartRoundTime(): void {
        const roundTimeSeconds = this.config.get<number>('time', 'roundTimeSeconds');
        this.setRoundTime(roundTimeSeconds);
    }

    decreaseRoundTime(deltaSeconds: number): void {
        this.setRoundTime(this.roundTime - deltaSeconds);
    }

    isRoundEnded(): boolean {
        return this.roundTime <= 0;
    }

    isMapVoteTime(): boolean {
        const mapVoteSeconds = this.config.get<number>('time', 'mapVoteSeconds');
        return this.roundTime <= mapVoteSeconds;
    }

    isScoreboardWatchTime(): boolean {
        const scoreboardWatchSeconds = this.config.get<number>('time', 'scoreboardWatchSeconds');
        return this.roundTime <= scoreboardWatchSeconds;
    }
}
