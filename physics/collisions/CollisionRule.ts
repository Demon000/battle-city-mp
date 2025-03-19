import { Entity } from '@/ecs/Entity';

export enum CollisionRuleType {
    PREVENT_MOVEMENT = 'prevent-movement',
    TRACK = 'track',
}

export enum CollisionEvent {
    BULLET_HIT_BRICK_WALL = 'bullet-hit-brick-wall',
    BULLET_HIT_STEEL_WALL = 'bullet-hit-steel-wall',
    BULLET_HIT_TANK = 'bullet-hit-tank',
    BULLET_HIT_BULLET = 'bullet-hit-bullet',
    BULLET_HIT_LEVEL_BORDER = 'bullet-hit-level-border',
    TANK_COLLIDE_FLAG = 'tank-collide-flag',
    TANK_COLLIDE_FLAG_BASE = 'tank-collide-flag-base',
    ENTITY_COLLIDE_TELEPORTER = 'entity-collide-teleporter',
}

type CollisionEventHandler = (
    movingEntity: Entity,
    staticEntity: Entity,
) => void;

export interface CollisionEvents {
    [CollisionEvent.BULLET_HIT_BRICK_WALL]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_STEEL_WALL]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_TANK]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_BULLET]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_LEVEL_BORDER]: CollisionEventHandler,
    [CollisionEvent.TANK_COLLIDE_FLAG]: CollisionEventHandler,
    [CollisionEvent.TANK_COLLIDE_FLAG_BASE]: CollisionEventHandler,
    [CollisionEvent.ENTITY_COLLIDE_TELEPORTER]: CollisionEventHandler;
}

export type CollisionRule = {
    type: CollisionRuleType.PREVENT_MOVEMENT;
    event?: CollisionEvent;
} | {
    type: CollisionRuleType.TRACK;
    entryEvent?: CollisionEvent;
    exitEvent?: CollisionEvent;
    minimumVolume?: number;
};
