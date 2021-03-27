import { GameObjectType } from '@/object/GameObjectType';
import Point from '../point/Point';

export enum CollisionResultType {
    PREVENT_MOVEMENT = 'prevent-movement',
    NOTIFY = 'notify',
}

export enum CollisionEventType {
    BULLET_HIT_WALL = 'bullet-hit-wall',
    BULLET_HIT_TANK = 'bullet-hit-tank',
    BULLET_HIT_BULLET = 'bullet-hit-bullet',
}

export type ICollisionResult = {
    type: CollisionResultType.PREVENT_MOVEMENT;
    tolerance?: number,
} | {
    type: CollisionResultType.NOTIFY,
    name: CollisionEventType,
};

export type CollisionRuleResultFunction = (
    movingObjectId: number,
    newPosition: Point,
    staticObjectId: number,
) => ICollisionResult;

export default interface ICollisionRule {
    movingTypes: GameObjectType[];
    staticTypes: GameObjectType[];
    result: (ICollisionResult | CollisionRuleResultFunction)[];
}
