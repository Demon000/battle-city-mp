import { EntityId } from '@/ecs/EntityId';
import { GameObjectFactoryBuildOptions } from '@/object/GameObjectFactory';
import { PartialPlayerOptions, PlayerOptions } from '@/player/Player';
import { GameServerStatus } from './GameServerStatus';

export enum GameEvent {
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_UNREGISTERED = 'object-unregisterd',

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

export type UnicastBatchGameEvent = CommonBatchGameEvent;

export type BroadcastBatchGameEvent = CommonBatchGameEvent |
[name: GameEvent.PLAYER_ADDED, playerOptions: PlayerOptions] |
[name: GameEvent.PLAYER_CHANGED, playerId: string, playerOptions: PartialPlayerOptions] |
[name: GameEvent.PLAYER_REMOVED, playerId: string] |

[name: GameEvent.TEAM_PLAYER_ADDED, teamId: string, playerId: string] |
[name: GameEvent.TEAM_PLAYER_REMOVED, teamId: string, playerId: string] |

[name: GameEvent.OBJECT_REGISTERED, buildOptions: GameObjectFactoryBuildOptions] |
[name: GameEvent.OBJECT_UNREGISTERED, entityId: EntityId] |
[name: GameEvent.ENTITY_COMPONENT_ADDED, entityId: EntityId, tag: string, data?: any] |
[name: GameEvent.ENTITY_COMPONENT_UPDATED, entityId: EntityId, tag: string, data?: any] |
[name: GameEvent.ENTITY_COMPONENT_REMOVED, entityId: EntityId, tag: string] |
[name: GameEvent.ROUND_TIME_UPDATED, roundTime: number];

export type BatchGameEvent = UnicastBatchGameEvent | BroadcastBatchGameEvent;
