import { EntityId } from '@/ecs/EntityId';
import { EntityBuildOptions } from '@/entity/EntityFactory';
import { PartialPlayerOptions, PlayerOptions } from '@/player/Player';
import { GameServerStatus } from './GameServerStatus';

export enum GameEvent {
    ENTITY_REGISTERED = 'er',
    ENTITY_UNREGISTERED = 'eu',

    ENTITY_COMPONENT_ADDED = 'eca',
    ENTITY_COMPONENT_UPDATED = 'ecu',
    ENTITY_COMPONENT_REMOVED = 'ecr',

    PLAYER_ADDED = 'pa',
    PLAYER_REMOVED = 'pr',
    PLAYER_CHANGED = 'pc',

    TEAM_PLAYER_ADDED = 'tpa',
    TEAM_PLAYER_REMOVED = 'tpr',

    SERVER_STATUS = 'ss',

    ROUND_TIME_UPDATED = 'rtu',
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

[name: GameEvent.ENTITY_REGISTERED, buildOptions: EntityBuildOptions] |
[name: GameEvent.ENTITY_UNREGISTERED, entityId: EntityId] |
[name: GameEvent.ENTITY_COMPONENT_ADDED, entityId: EntityId, tag: string, data?: any] |
[name: GameEvent.ENTITY_COMPONENT_UPDATED, entityId: EntityId, tag: string, data?: any] |
[name: GameEvent.ENTITY_COMPONENT_REMOVED, entityId: EntityId, tag: string] |
[name: GameEvent.ROUND_TIME_UPDATED, roundTime: number];

export type BatchGameEvent = UnicastBatchGameEvent | BroadcastBatchGameEvent;
