import IGameObjectProperties from './IGameObjectProperties';

export enum GameObjectType {
    ANY = 'any',
    BRICK_WALL = 'brick-wall',
    STEEL_WALL = 'steel-wall',
    PLAYER_SPAWN = 'player-spawn',
    LEVEL_BORDER = 'level-border',
    TANK = 'tank',
    BULLET = 'bullet',
}

export enum GameShortObjectType {
    BRICK_WALL = 'B',
    STEEL_WALL = 'S',
    PLAYER_SPAWN = 'O',
    LEVEL_BORDER = '#',
}

const properties: IGameObjectProperties[] = [
    {
        type: GameObjectType.BRICK_WALL,
        shortType: GameShortObjectType.BRICK_WALL,
        width: 4,
        height: 4,
        sprites: {
            even: {
                steps: [
                    {
                        filename: 'brick_wall_even.png',
                    },
                ],
            },
            odd: {
                steps: [
                    {
                        filename: 'brick_wall_odd.png',
                    },
                ],
            },
        },
    },
    {
        type: GameObjectType.STEEL_WALL,
        shortType: GameShortObjectType.STEEL_WALL,
        width: 8,
        height: 8,
        sprites: {
            default: {
                steps: [
                    {
                        filename: 'steel_wall.png',
                    },
                ],
            },
        },
    },
    {
        type: GameObjectType.PLAYER_SPAWN,
        shortType: GameShortObjectType.PLAYER_SPAWN,
        width: 16,
        height: 16,
    },
    {
        type: GameObjectType.LEVEL_BORDER,
        shortType: GameShortObjectType.LEVEL_BORDER,
        width: 16,
        height: 16,
        sprites: {
            default: {
                steps: [
                    {
                        filename: 'level_border.png',
                    },
                ],
            },
        },
    },
    {
        type: GameObjectType.TANK,
        width: 16,
        height: 16,
        sprites: {
            tank_tier_1_up: {
                steps: [
                    {
                        filename: 'tank_tier_1_up_frame_1.png',
                        duration: 500,
                    },
                    {
                        filename: 'tank_tier_1_up_frame_2.png',
                        duration: 500,
                    },
                ],
                duration: 1000,
            },
        },
    },
    {
        type: GameObjectType.BULLET,
        width: 4,
        height: 4,
        sprites: {
            bullet_up: {
                steps: [
                    {
                        filename: 'bullet_up.png',
                    },
                ],
            },
            bullet_right: {
                steps: [
                    {
                        filename: 'bullet_right.png',
                    },
                ],
            },
            bullet_down: {
                steps: [
                    {
                        filename: 'bullet_down.png',
                    },
                ],
            },
            bullet_left: {
                steps: [
                    {
                        filename: 'bullet_left.png',
                    },
                ],
            },
        },
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
    static getTypeProperties(type: string): IGameObjectProperties {
        const properties = typePropertiesMap.get(type);
        if (!properties) {
            throw new Error('Invalid type');
        }
        return properties;
    }

    static getShortTypeProperties(shortType: string): IGameObjectProperties {
        const properties = shortTypePropertiesMap.get(shortType);
        if (!properties) {
            throw new Error('Invalid short type ' + shortType);
        }
        return properties;
    }
}
