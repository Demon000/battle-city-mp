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

    PLAYER_ACTION = 'player-action',
    PLAYER_REQUEST_TANK_COLOR = 'player-request-tank-color',
    PLAYER_REQUEST_TANK_TIER = 'player-request-tank-tier',
    PLAYER_REQUEST_TANK_SPAWN = 'player-request-tank-spawn',
    PLAYER_REQUEST_TANK_DESPAWN = 'player-request-tank-despawn',
    PLAYER_REQUEST_SERVER_STATUS = 'player-request-server-status',
    PLAYER_SET_NAME = 'player-set-name',
    PLAYER_MAP_EDITOR_CREATE_OBJECTS = 'player-map-editor-create-objects',
    PLAYER_MAP_EDITOR_DESTROY_OBJECTS = 'player-map-editor-destroy-objects',
    PLAYER_MAP_EDITOR_SAVE = 'player-map-editor-save',

    PLAYER_BATCH = 'player-batch',
    BROADCAST_BATCH = 'broadcast-batch',
    BATCH = 'batch',
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
