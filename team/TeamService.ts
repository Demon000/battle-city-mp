import { assert } from '@/utils/assert';
import { MapRepository } from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { Team } from './Team';

export enum TeamServiceEvent {
    TEAM_PLAYER_ADDED = 'team-player-added',
    TEAM_PLAYER_REMOVED = 'team-player-removed',
    TEAMS_CHANGED = 'teams-changed',
}

export interface TeamServiceEvents {
    [TeamServiceEvent.TEAM_PLAYER_ADDED]: (teamId: string, playerId: string) => void,
    [TeamServiceEvent.TEAM_PLAYER_REMOVED]: (teamId: string, playerId: string) => void,
    [TeamServiceEvent.TEAMS_CHANGED]: () => void,
}

export class TeamService {
    private repository;
    emitter = new EventEmitter<TeamServiceEvents>();

    constructor(repository: MapRepository<string, Team>) {
        this.repository = repository;
    }

    addTeams(teams: Iterable<Team>): void {
        for (const team of teams) {
            this.repository.add(team.id, team);
        }

        this.emitter.emit(TeamServiceEvent.TEAMS_CHANGED);
    }

    getTeams(): Iterable<Team> | undefined {
        return this.repository.getAll();
    }

    getTeam(teamId: string): Team {
        return this.repository.get(teamId);
    }

    findTeamById(teamId: string): Team | undefined {
        return this.repository.find(teamId);
    }

    addTeamPlayer(teamId: string, playerId: string): void {
        const team = this.repository.get(teamId);
        team.playerIds.push(playerId);
        this.emitter.emit(TeamServiceEvent.TEAM_PLAYER_ADDED, teamId, playerId);
    }

    removeTeamPlayer(teamId: string, playerId: string): void {
        const team = this.repository.get(teamId);
        const playerIdIndex = team.playerIds.findIndex(id => id === playerId);
        team.playerIds.splice(playerIdIndex, 1);
        this.emitter.emit(TeamServiceEvent.TEAM_PLAYER_REMOVED, teamId, playerId);
    }

    getTeamWithLeastPlayers(): Team {
        let foundTeam;

        const teams = this.repository.getAll();
        for (const team of teams) {
            if (foundTeam === undefined
                || team.playerIds.length < foundTeam.playerIds.length) {
                foundTeam = team;
            }
        }

        assert(foundTeam !== undefined, 'Failed to find team with least players');

        return foundTeam;
    }

    isTeamSwitchingAllowed(fromTeamId: string, toTeamId: string): boolean {
        const fromTeam = this.repository.get(fromTeamId);
        const toTeam = this.repository.get(toTeamId);

        return toTeam.playersCount <= fromTeam.playersCount;
    }

    clear(): void {
        this.repository.clear();
    }
}
