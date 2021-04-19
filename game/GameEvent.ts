import { GameObjectOptions, PartialGameObjectOptions } from '@/object/GameObject';
import { PlayerOptions } from '@/player/Player';
import { GameServerStatus } from './GameServerStatus';

export enum GameEvent {
    OBJECT_CHANGED = 'object-changed',
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_UNREGISTERED = 'object-unregisterd',

    PLAYER_ADDED = 'player-added',
    PLAYER_REMOVED = 'player-removed',
    PLAYER_CHANGED = 'player-changed',

    SERVER_STATUS = 'server-status',

    PLAYER_BATCH = 'player-batch',
    BROADCAST_BATCH = 'broadcast-batch',
}

export type UnicastBatchGameEvent =
    [name: GameEvent.SERVER_STATUS, serverStatus: GameServerStatus];

export type BroadcastBatchGameEvent =
    [name: GameEvent.PLAYER_ADDED, playerOptions: PlayerOptions] |
    [name: GameEvent.PLAYER_CHANGED, playerOptions: PlayerOptions] |
    [name: GameEvent.PLAYER_REMOVED, playerId: string] |

    [name: GameEvent.OBJECT_REGISTERED, objectOptions: GameObjectOptions] |
    [name: GameEvent.OBJECT_CHANGED, objectId: number, options: PartialGameObjectOptions] |
    [name: GameEvent.OBJECT_UNREGISTERED, objectId: number];

export type BatchGameEvent = UnicastBatchGameEvent | BroadcastBatchGameEvent;
