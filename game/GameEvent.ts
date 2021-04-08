import { GameObjectOptions, PartialGameObjectOptions } from '@/object/GameObject';
import { PlayerOptions } from '@/player/Player';

export enum GameEvent {
    OBJECTS_REGISTERD = 'objects-registered',
    OBJECT_CHANGED = 'object-changed',
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_UNREGISTERED = 'object-unregisterd',

    PLAYERS_ADDED = 'players-added',
    PLAYER_ADDED = 'player-added',
    PLAYER_REMOVED = 'player-removed',
    PLAYER_CHANGED = 'player-changed',

    PLAYER_ACTION = 'player-action',
    PLAYER_REQUEST_TANK_COLOR = 'player-request-tank-color',
    PLAYER_REQUEST_TANK_TIER = 'player-request-tank-tier',
    PLAYER_REQUEST_TANK_SPAWN = 'player-request-tank-spawn',
    PLAYER_REQUEST_TANK_DESPAWN = 'player-request-tank-despawn',
    PLAYER_REQUEST_GAME_OBJECTS = 'player-request-game-objects',
    PLAYER_REQUEST_PLAYERS = 'player-request-players',

    PLAYER_OBJECTS_REGISTERD = 'player-objects-registered',
    PLAYER_PLAYERS_ADDED = 'player-players-added',

    PLAYER_BATCH = 'player-batch',
    BROADCAST_BATCH = 'broadcast-batch',
    BATCH = 'batch',
}

export type UnicastBatchGameEvent =
    [name: GameEvent.OBJECTS_REGISTERD, objectsOptions: GameObjectOptions[]] |
    [name: GameEvent.PLAYERS_ADDED, playersOptions: PlayerOptions[]];

export type BroadcastBatchGameEvent =
    [name: GameEvent.PLAYER_ADDED, playerOptions: PlayerOptions] |
    [name: GameEvent.PLAYER_CHANGED, playerOptions: PlayerOptions] |
    [name: GameEvent.PLAYER_REMOVED, playerId: string] |

    [name: GameEvent.OBJECT_REGISTERED, objectOptions: GameObjectOptions] |
    [name: GameEvent.OBJECT_CHANGED, objectId: number, options: PartialGameObjectOptions] |
    [name: GameEvent.OBJECT_UNREGISTERED, objectId: number];

export type BatchGameEvent = UnicastBatchGameEvent | BroadcastBatchGameEvent;
