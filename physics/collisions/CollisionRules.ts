import { GameObjectType } from '@/object/GameObjectType';
import { ICollisionRule, CollisionEvent, CollisionResultEvent } from './ICollisionRule';

export const rules: ICollisionRule[] = [
    {
        movingTypes: [GameObjectType.TANK],
        staticTypes: [
            GameObjectType.BRICK_WALL,
            GameObjectType.STEEL_WALL,
            GameObjectType.LEVEL_BORDER,
            GameObjectType.TANK,
            GameObjectType.WATER,
        ],
        result: [
            {
                type: CollisionResultEvent.PREVENT_MOVEMENT,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.TANK],
        staticTypes: [
            GameObjectType.ICE,
            GameObjectType.SAND,
        ],
        result: [
            {
                type: CollisionResultEvent.TRACK,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.TANK],
        staticTypes: [
            GameObjectType.FLAG,
        ],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.TANK_COLLIDE_FLAG,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.LEVEL_BORDER],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.BULLET_HIT_LEVEL_BORDER,
            },
            {
                type: CollisionResultEvent.PREVENT_MOVEMENT,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.BRICK_WALL],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.BULLET_HIT_BRICK_WALL,
            },
            {
                type: CollisionResultEvent.PREVENT_MOVEMENT,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.STEEL_WALL],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.BULLET_HIT_STEEL_WALL,
            },
            {
                type: CollisionResultEvent.PREVENT_MOVEMENT,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.TANK],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.BULLET_HIT_TANK,
            },
        ],
    },
    {
        movingTypes: [GameObjectType.BULLET],
        staticTypes: [GameObjectType.BULLET],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.BULLET_HIT_BULLET,
            },
            {
                type: CollisionResultEvent.PREVENT_MOVEMENT,
            },
        ],
    },
];
