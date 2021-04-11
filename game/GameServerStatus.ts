import { GameObjectOptions } from '@/object/GameObject';
import { PlayerOptions } from '@/player/Player';

export interface GameServerStatus {
    playersOptions: PlayerOptions[];
    objectsOptions: GameObjectOptions[];
    tps: number;
}
