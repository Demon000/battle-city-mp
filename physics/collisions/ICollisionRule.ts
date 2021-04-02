import { GameObjectType } from '@/object/GameObjectType';

export enum CollisionResultType {
    PREVENT_MOVEMENT = 'prevent-movement',
    NOTIFY = 'notify',
}

export enum CollisionEventType {
    BULLET_HIT_BRICK_WALL = 'bullet-hit-brick-wall',
    BULLET_HIT_STEEL_WALL = 'bullet-hit-steel-wall',
    BULLET_HIT_TANK = 'bullet-hit-tank',
    BULLET_HIT_BULLET = 'bullet-hit-bullet',
    BULLET_HIT_LEVEL_BORDER = 'bullet-hit-level-border',
    TANK_ON_ICE = 'tank-on-ice',
}

export type ICollisionResult = {
    type: CollisionResultType.PREVENT_MOVEMENT;
} | {
    type: CollisionResultType.NOTIFY,
    name: CollisionEventType,
};

export default interface ICollisionRule {
    movingTypes: GameObjectType[];
    staticTypes: GameObjectType[];
    result: ICollisionResult[];
}
