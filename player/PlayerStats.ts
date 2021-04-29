import Tank from '@/tank/Tank';
import Team from '@/team/Team';
import Player from './Player';

export default interface PlayerStats {
    player: Player,
    team: Team | undefined,
    tank: Tank | undefined,
}
