import { TankTier } from '@/tank/TankTier';
import Team from '@/team/Team';
import Player from './Player';

export default interface PlayerStats {
    player: Player,
    team: Team | undefined,
    tier: TankTier,
}
