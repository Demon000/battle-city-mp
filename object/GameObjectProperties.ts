import { Direction } from '@/physics/Direction';
import now from 'performance-now';
import GameObject from './GameObject';
import { GameObjectType, GameShortObjectType } from './GameObjectType';
import IGameObjectProperties, { ISprite, ISpriteSet } from './IGameObjectProperties';

const properties: IGameObjectProperties[] = [
    {
        type: GameObjectType.BRICK_WALL,
        shortType: GameShortObjectType.BRICK_WALL,
        width: 4,
        height: 4,
        sets: [
            {
                steps: [
                    {
                        filename: 'brick_wall_even.png',
                    },
                ],
                position: {
                    mod: 8,
                    divide: 4,
                    equals: [
                        {
                            x: 0,
                            y: 0,
                        },
                        {
                            x: 1,
                            y: 1,
                        },
                    ],
                },
            },
            {
                steps: [
                    {
                        filename: 'brick_wall_odd.png',
                    },
                ],
                position: {
                    mod: 8,
                    divide: 4,
                    equals: [
                        {
                            x: 0,
                            y: 1,
                        },
                        {
                            x: 1,
                            y: 0,
                        },
                    ],
                },
            },
        ],
    },
    {
        type: GameObjectType.STEEL_WALL,
        shortType: GameShortObjectType.STEEL_WALL,
        width: 8,
        height: 8,
        sets: [
            {
                steps: [
                    {
                        filename: 'steel_wall.png',
                    },
                ],
            },
        ],
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
        sets: [
            {
                steps: [
                    {
                        filename: 'level_border.png',
                    },
                ],
            },
        ],
    },
    {
        type: GameObjectType.TANK,
        width: 16,
        height: 16,
        directionAxisSnapping: 4,
        sets: [
            {
                duration: 100,
                direction: Direction.UP,
                steps: [
                    {
                        filename: 'tank_tier_1_up_frame_1.png',
                        duration: 50,
                    },
                    {
                        filename: 'tank_tier_1_up_frame_2.png',
                        duration: 50,
                    },
                ],
            },
            {
                duration: 100,
                direction: Direction.RIGHT,
                steps: [
                    {
                        filename: 'tank_tier_1_right_frame_1.png',
                        duration: 50,
                    },
                    {
                        filename: 'tank_tier_1_right_frame_2.png',
                        duration: 50,
                    },
                ],
            },
            {
                duration: 100,
                direction: Direction.DOWN,
                steps: [
                    {
                        filename: 'tank_tier_1_down_frame_1.png',
                        duration: 50,
                    },
                    {
                        filename: 'tank_tier_1_down_frame_2.png',
                        duration: 50,
                    },
                ],
            },
            {
                duration: 100,
                direction: Direction.LEFT,
                steps: [
                    {
                        filename: 'tank_tier_1_left_frame_1.png',
                        duration: 50,
                    },
                    {
                        filename: 'tank_tier_1_left_frame_2.png',
                        duration: 50,
                    },
                ],
            },
        ],
    },
    {
        type: GameObjectType.BULLET,
        width: 4,
        height: 4,
        sets: [
            {
                direction: Direction.UP,
                steps: [
                    {
                        filename: 'bullet_up.png',
                    },
                ],
            },
            {
                direction: Direction.RIGHT,
                steps: [
                    {
                        filename: 'bullet_right.png',
                    },
                ],
            },
            {
                direction: Direction.DOWN,
                steps: [
                    {
                        filename: 'bullet_down.png',
                    },
                ],
            },
            {
                direction: Direction.LEFT,
                steps: [
                    {
                        filename: 'bullet_left.png',
                    },
                ],
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
    static getTypeProperties(type: string): IGameObjectProperties {
        const properties = typePropertiesMap.get(type);
        if (!properties) {
            throw new Error('Invalid type ' + type);
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

    static findSpriteSets(object: GameObject): ISpriteSet[] {
        const properties = this.getTypeProperties(object.type);
        if (properties.sets === undefined) {
            return [];
        }

        const matchingSets = new Array<ISpriteSet>();
        for (const set of properties.sets) {
            if (set.direction !== undefined && set.direction !== object.direction) {
                continue;
            }
            
            if (set.position !== undefined) {
                const x = object.position.x % set.position.mod / set.position.divide;
                const y = object.position.y % set.position.mod / set.position.divide;
                let foundPoint = false;

                for (const point of set.position.equals) {
                    if (point.x === x && point.y === y) {
                        foundPoint = true;
                        break;
                    }
                }

                if (!foundPoint) {
                    continue;
                }
            }

            matchingSets.push(set);
        }

        return matchingSets;
    }

    static findAnimationSprite(object: GameObject, set?: ISpriteSet): ISprite | undefined {
        if (set === undefined) {
            set = this.findSpriteSets(object)[0];
        }

        if (set === undefined) {
            return undefined;
        }

        if (set.duration === undefined) {
            return set.steps[0];
        }

        const currentAnimationTime = (now() - object.spawnTime) % set.duration;
        let iterationAnimationTime = 0;
        for (const step of set.steps) {
            if (step.duration === undefined) {
                return step;
            }

            if (currentAnimationTime < iterationAnimationTime + step.duration) {
                return step;
            }

            iterationAnimationTime += step.duration;
        }

        return undefined;
    }

    static findSprite(object: GameObject): ISprite | undefined {
        return this.findSpriteSets(object)[0]?.steps[0];
    }
}
