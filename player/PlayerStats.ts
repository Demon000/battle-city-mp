import { Team } from '@/team/Team';
import { Player } from './Player';

export interface PlayerStats {
    player: Player,
    team: Team | undefined,
    tier: string,
}
