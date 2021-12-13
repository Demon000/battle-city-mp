import { GameObjectFactoryBuildOptions } from '@/object/GameObjectFactory';
import { PartialPlayerOptions, PlayerOptions } from '@/player/Player';
import { GameServerStatus } from './GameServerStatus';

export enum GameEvent {
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_UNREGISTERED = 'object-unregisterd',

    OBJECTS_REGISTERED = 'objects-registered',
    OBJECTS_UNREGISTERED = 'objects-unregistered',

    ENTITY_COMPONENT_ADDED = 'entity-component-added',
    ENTITY_COMPONENT_UPDATED = 'entity-component-updated',
    ENTITY_COMPONENT_REMOVED = 'entity-component-removed',

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


export type GameEntityComponentEvent =
    GameEvent.ENTITY_COMPONENT_ADDED |
    GameEvent.ENTITY_COMPONENT_UPDATED |
    GameEvent.ENTITY_COMPONENT_REMOVED;

export type UnicastBatchGameEvent = CommonBatchGameEvent |
[name: GameEvent.OBJECT_REGISTERED, buildOptions: GameObjectFactoryBuildOptions] |
[name: GameEvent.OBJECT_UNREGISTERED, objectId: number] |
[name: GameEvent.OBJECTS_REGISTERED, buildOptions: GameObjectFactoryBuildOptions[]] |
[name: GameEvent.OBJECTS_UNREGISTERED, objectIds: number[]] |
[name: GameEvent.ENTITY_COMPONENT_ADDED, entityId: number, tag: string, data?: any] |
[name: GameEvent.ENTITY_COMPONENT_UPDATED, entityId: number, tag: string, data?: any] |
[name: GameEvent.ENTITY_COMPONENT_REMOVED, entityId: number, tag: string];

export type BroadcastBatchGameEvent = CommonBatchGameEvent |
[name: GameEvent.PLAYER_ADDED, playerOptions: PlayerOptions] |
[name: GameEvent.PLAYER_CHANGED, playerId: string, playerOptions: PartialPlayerOptions] |
[name: GameEvent.PLAYER_REMOVED, playerId: string] |

[name: GameEvent.TEAM_PLAYER_ADDED, teamId: string, playerId: string] |
[name: GameEvent.TEAM_PLAYER_REMOVED, teamId: string, playerId: string] |

[name: GameEvent.ROUND_TIME_UPDATED, roundTime: number];

export type BatchGameEvent = UnicastBatchGameEvent | BroadcastBatchGameEvent;
