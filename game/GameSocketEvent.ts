import { ActionOptions } from '@/actions/Action';
import { Color } from '@/drawable/Color';
import { TankTier } from '@/subtypes/TankTier';
import { BatchGameEvent } from './GameEvent';

export enum GameSocketEvent {
    PLAYER_ACTION = 'player-action',

    PLAYER_REQUEST_TANK_COLOR = 'player-request-tank-color',
    PLAYER_REQUEST_TANK_TIER = 'player-request-tank-tier',
    PLAYER_REQUEST_TANK_SPAWN = 'player-request-tank-spawn',
    PLAYER_REQUEST_TANK_DESPAWN = 'player-request-tank-despawn',
    PLAYER_REQUEST_TEAM = 'player-request-team',
    PLAYER_REQUEST_SERVER_STATUS = 'player-request-server-status',

    PLAYER_SET_NAME = 'player-set-name',

    BATCH = 'batch',
}

export interface GameSocketEvents {
    [GameSocketEvent.PLAYER_ACTION]: (action: ActionOptions) => void;
    [GameSocketEvent.PLAYER_REQUEST_TANK_COLOR]: (color: Color) => void;
    [GameSocketEvent.PLAYER_REQUEST_TANK_TIER]: (tier: TankTier) => void;
    [GameSocketEvent.PLAYER_REQUEST_TANK_SPAWN]: () => void;
    [GameSocketEvent.PLAYER_REQUEST_TANK_DESPAWN]: () => void;
    [GameSocketEvent.PLAYER_REQUEST_TEAM]: (teamId: string | null) => void,
    [GameSocketEvent.PLAYER_REQUEST_SERVER_STATUS]: () => void;
    [GameSocketEvent.PLAYER_SET_NAME]: (name: string) => void;
    [GameSocketEvent.BATCH]: (events: BatchGameEvent[]) => void;
}
