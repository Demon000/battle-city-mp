import { GameObjectType } from '@/object/GameObjectType';

export enum CollisionResultEvent {
    PREVENT_MOVEMENT = 'prevent-movement',
    NOTIFY = 'notify',
}

export enum CollisionEvent {
    BULLET_HIT_BRICK_WALL = 'bullet-hit-brick-wall',
    BULLET_HIT_STEEL_WALL = 'bullet-hit-steel-wall',
    BULLET_HIT_TANK = 'bullet-hit-tank',
    BULLET_HIT_BULLET = 'bullet-hit-bullet',
    BULLET_HIT_LEVEL_BORDER = 'bullet-hit-level-border',
    TANK_ON_ICE = 'tank-on-ice',
}

type CollisionEventHandler = (movingObjectId: number, staticObjectId: number) => void;

export interface CollisionEvents {
    [CollisionEvent.BULLET_HIT_BRICK_WALL]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_STEEL_WALL]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_TANK]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_BULLET]: CollisionEventHandler,
    [CollisionEvent.BULLET_HIT_LEVEL_BORDER]: CollisionEventHandler,
    [CollisionEvent.TANK_ON_ICE]: CollisionEventHandler,
}

export type ICollisionResult = {
    type: CollisionResultEvent.PREVENT_MOVEMENT;
} | {
    type: CollisionResultEvent.NOTIFY,
    name: CollisionEvent,
};

export default interface ICollisionRule {
    movingTypes: GameObjectType[];
    staticTypes: GameObjectType[];
    result: ICollisionResult[];
}
