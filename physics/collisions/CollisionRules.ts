import { GameObjectType } from '@/object/GameObjectType';
import ICollisionRule, { CollisionEventType, CollisionResultType } from './ICollisionRule';

export const rules: ICollisionRule[] = [
    {
        movingTypes: [GameObjectType.TANK],
        staticTypes: [GameObjectType.BRICK_WALL, GameObjectType.STEEL_WALL, GameObjectType.LEVEL_BORDER],
        result: [
            {
                type: CollisionResultType.PREVENT_MOVEMENT,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.TANK],
        staticTypes: [GameObjectType.TANK],
        result: [
            {
                type: CollisionResultType.PREVENT_MOVEMENT,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.LEVEL_BORDER],
        result: [
            {
                type: CollisionResultType.NOTIFY,
                name: CollisionEventType.BULLET_HIT_LEVEL_BORDER,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.BRICK_WALL, GameObjectType.STEEL_WALL],
        result: [
            {
                type: CollisionResultType.NOTIFY,
                name: CollisionEventType.BULLET_HIT_WALL,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.TANK],
        result: [
            {
                type: CollisionResultType.NOTIFY,
                name: CollisionEventType.BULLET_HIT_TANK,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.BULLET],
        result: [
            {
                type: CollisionResultType.NOTIFY,
                name: CollisionEventType.BULLET_HIT_BULLET,
            },
        ],
    },
];
