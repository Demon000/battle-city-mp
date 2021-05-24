import { GameObjectType, GameShortObjectType } from './GameObjectType';
import IGameObjectProperties from './IGameObjectProperties';

const properties: IGameObjectProperties[] = [
    {
        type: GameObjectType.STEEL_WALL,
        shortType: GameShortObjectType.STEEL_WALL,
        width: 8,
        height: 8,
        savable: true,
    },
    {
        type: GameObjectType.BUSH,
        shortType: GameShortObjectType.BUSH,
        width: 8,
        height: 8,
        savable: true,
    },
    {
        type: GameObjectType.PLAYER_SPAWN,
        shortType: GameShortObjectType.PLAYER_SPAWN,
        width: 16,
        height: 16,
        savable: true,
    },
    {
        type: GameObjectType.LEVEL_BORDER,
        shortType: GameShortObjectType.LEVEL_BORDER,
        width: 16,
        height: 16,
        savable: true,
    },
    {
        type: GameObjectType.ICE,
        shortType: GameShortObjectType.ICE,
        width: 8,
        height: 8,
        savable: true,
    },
    {
        type: GameObjectType.SAND,
        shortType: GameShortObjectType.SAND,
        width: 8,
        height: 8,
        savable: true,
    },
    {
        type: GameObjectType.GRASS,
        shortType: GameShortObjectType.GRASS,
        width: 8,
        height: 8,
        savable: true,
    },
    {
        type: GameObjectType.DIRT,
        shortType: GameShortObjectType.DIRT,
        width: 8,
        height: 8,
        savable: true,
    },
    {
        type: GameObjectType.WATER,
        shortType: GameShortObjectType.WATER,
        width: 8,
        height: 8,
        savable: true,
    },
    {
        type: GameObjectType.BRICK_WALL,
        shortType: GameShortObjectType.BRICK_WALL,
        width: 4,
        height: 4,
        savable: true,
    },
    {
        type: GameObjectType.SMOKE,
        width: 0,
        height: 0,
        automaticDestroyTime: 1000,
    },
    {
        type: GameObjectType.TANK,
        width: 16,
        height: 16,
        directionAxisSnapping: 4,
        // audioEffects: [
        //     {
        //         filename: 'tank_moving.wav',
        //         loop: true,
        //         meta: {
        //             isMoving: true,
        //         },
        //     },
        // ],
    },
    {
        type: GameObjectType.BULLET,
        width: 2,
        height: 2,
        audioEffects: [
            {
                filename: 'shoot_bullet.wav',
            },
        ],
    },
    {
        type: GameObjectType.EXPLOSION,
        width: 0,
        height: 0,
        automaticDestroyTime: 240,
        audioEffects: [
            {
                filename: 'destroy_tank.wav',
                meta: {
                    destroyedObjectType: GameObjectType.TANK,
                },
            },
            {
                filename: 'bullet_hit.wav',
                meta: {
                    destroyedObjectType: GameObjectType.NONE,
                },
            },
            {
                filename: 'destroy.wav',
            },
        ],
    },
];

const typePropertiesMap = new Map<string, IGameObjectProperties>();
const shortTypePropertiesMap = new Map<string, IGameObjectProperties>();

for (const property of properties) {
    typePropertiesMap.set(property.type, property);
    if (property.shortType) {
        shortTypePropertiesMap.set(property.shortType, property);
    }
}

export default class GameObjectProperties {
    static getTypeProperties(type: GameObjectType): IGameObjectProperties {
        const properties = typePropertiesMap.get(type);
        if (!properties) {
            throw new Error('Invalid type ' + type);
        }
        return properties;
    }

    static getShortTypeProperties(shortType: GameShortObjectType): IGameObjectProperties {
        const properties = shortTypePropertiesMap.get(shortType);
        if (!properties) {
            throw new Error('Invalid short type ' + shortType);
        }
        return properties;
    }
}
