import { EntityType } from '@/entity/EntityType';
import { CollisionRule, CollisionEvent, CollisionResultEvent } from './ICollisionRule';

export const rules: CollisionRule[] = [
    {
        movingType: EntityType.TANK,
        staticTypes: [
            EntityType.BRICK_WALL,
            EntityType.STEEL_WALL,
            EntityType.LEVEL_BORDER,
            EntityType.TANK,
            EntityType.WATER,
        ],
        result: [
            {
                type: CollisionResultEvent.PREVENT_MOVEMENT,
            },
        ],
    },
    {
        movingType: EntityType.TANK,
        staticTypes: [
            EntityType.FLAG_BASE,
        ],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.TANK_COLLIDE_FLAG_BASE,
            },
        ],
    },
    {
        movingType: EntityType.TANK,
        staticTypes: [
            EntityType.FLAG,
        ],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.TANK_COLLIDE_FLAG,
                minimumVolume: 16 * 16 * 0.75,
            },
        ],
    },
    {
        movingType: EntityType.TANK,
        staticTypes: [
            EntityType.TELEPORTER,
        ],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.ENTITY_COLLIDE_TELEPORTER,
                minimumVolume: 16 * 16 * 0.75,
            },
        ],
    },
    {
        movingType: EntityType.BULLET,
        staticTypes: [EntityType.LEVEL_BORDER],
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
        movingType: EntityType.BULLET,
        staticTypes: [EntityType.BRICK_WALL],
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
        movingType: EntityType.BULLET,
        staticTypes: [EntityType.STEEL_WALL],
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
        movingType: EntityType.BULLET,
        staticTypes: [EntityType.TANK],
        result: [
            {
                type: CollisionResultEvent.NOTIFY,
                name: CollisionEvent.BULLET_HIT_TANK,
            },
        ],
    },
    {
        movingType: EntityType.BULLET,
        staticTypes: [EntityType.BULLET],
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
