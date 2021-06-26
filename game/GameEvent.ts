import { GameObjectOptions, PartialGameObjectOptions } from '@/object/GameObject';
import { PartialPlayerOptions, PlayerOptions } from '@/player/Player';
import { GameServerStatus } from './GameServerStatus';

export enum GameEvent {
    OBJECT_CHANGED = 'object-changed',
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_UNREGISTERED = 'object-unregisterd',

    PLAYER_ADDED = 'player-added',
    PLAYER_REMOVED = 'player-removed',
    PLAYER_CHANGED = 'player-changed',

    TEAM_PLAYER_ADDED = 'team-player-added',
    TEAM_PLAYER_REMOVED = 'team-player-removed',

    SERVER_STATUS = 'server-status',

    ROUND_TIME_UPDATED = 'round-time-updated',
}

export type CommonBatchGameEvent =
    [name: GameEvent.SERVER_STATUS, serverStatus: GameServerStatus];


export type UnicastBatchGameEvent = CommonBatchGameEvent;

export type BroadcastBatchGameEvent = CommonBatchGameEvent |
[name: GameEvent.PLAYER_ADDED, playerOptions: PlayerOptions] |
[name: GameEvent.PLAYER_CHANGED, playerId: string, playerOptions: PartialPlayerOptions] |
[name: GameEvent.PLAYER_REMOVED, playerId: string] |

[name: GameEvent.TEAM_PLAYER_ADDED, teamId: string, playerId: string] |
[name: GameEvent.TEAM_PLAYER_REMOVED, teamId: string, playerId: string] |

[name: GameEvent.OBJECT_REGISTERED, objectOptions: GameObjectOptions] |
[name: GameEvent.OBJECT_CHANGED, objectId: number, options: PartialGameObjectOptions] |
[name: GameEvent.OBJECT_UNREGISTERED, objectId: number] |
[name: GameEvent.ROUND_TIME_UPDATED, roundTime: number];

export type BatchGameEvent = UnicastBatchGameEvent | BroadcastBatchGameEvent;
