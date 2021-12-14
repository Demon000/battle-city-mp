import { EntityId } from '@/ecs/EntityId';
import { Point } from '../point/Point';

export enum CollisionResultEvent {
    PREVENT_MOVEMENT = 'prevent-movement',
    NOTIFY = 'notify',
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
}

type CollisionEventHandler = (
    movingObjectId: EntityId,
    staticObjectId: EntityId,
    position: Point,
) => void;

export interface CollisionEvents {
    [CollisionEvent.BULLET_HIT_BRICK_WALL]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_STEEL_WALL]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_TANK]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_BULLET]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_LEVEL_BORDER]: CollisionEventHandler,
    [CollisionEvent.TANK_COLLIDE_FLAG]: CollisionEventHandler,
    [CollisionEvent.TANK_COLLIDE_FLAG_BASE]: CollisionEventHandler,
}

export type ICollisionResult = {
    type: CollisionResultEvent.PREVENT_MOVEMENT;
} | {
    type: CollisionResultEvent.TRACK;
} | {
    type: CollisionResultEvent.NOTIFY;
    name: CollisionEvent;
};

export interface ICollisionRule {
    movingTypes: string[];
    staticTypes: string[];
    result: ICollisionResult[];
}
