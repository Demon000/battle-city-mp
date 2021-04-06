import { BulletPower } from '@/bullet/BulletPower';
import { ExplosionType } from '@/explosion/ExplosionType';
import { Direction } from '@/physics/Direction';
import { TankSmoke } from '@/tank/TankSmoke';
import { TankTier } from '@/tank/TankTier';
import { GameObjectType, GameShortObjectType } from './GameObjectType';
import IGameObjectProperties, { ISpriteSet, RenderPass, ResourceMeta } from './IGameObjectProperties';

const generateTankTierSpriteSet = (direction: Direction, tier: TankTier,
    frames: number, totalDuration?: number, meta?: ResourceMeta): ISpriteSet => {
    let frameDuration;
    if (totalDuration === undefined) {
        frameDuration = undefined;
    } else {
        frameDuration = totalDuration / frames;
    }

    const set = {
        duration: totalDuration,
        direction,
        meta,
        steps: [],
    } as ISpriteSet;

    for (let i = 0; i < frames; i++) {
        set.steps.push({
            filename: `tank_${tier}_${direction}_${i}.png`,
            renderPass: RenderPass.TANK,
            duration: frameDuration,
        });
    }

    return set;
};

const generateTankTierSpriteSets = (tier: TankTier): ISpriteSet[] => {
    const sets = new Array<ISpriteSet>();

    for (const direction of Object.values(Direction)) {
        sets.push(
            generateTankTierSpriteSet(direction, tier, 2, 125, {
                tier,
                isMoving: true,
            }),
            generateTankTierSpriteSet(direction, tier, 1, undefined, {
                tier,
                isMoving: false,
            }),
        );
    }

    return sets;
};

const generateTankSpriteSets = (): ISpriteSet[] => {
    const sets = new Array<ISpriteSet>();

    for (const tier of Object.values(TankTier)) {
        sets.push(...generateTankTierSpriteSets(tier));
    }

    return sets;
};

const properties: IGameObjectProperties[] = [
    {
        type: GameObjectType.BRICK_WALL,
        shortType: GameShortObjectType.BRICK_WALL,
        width: 4,
        height: 4,
        spriteSets: [
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
        spriteSets: [
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
        type: GameObjectType.BUSH,
        shortType: GameShortObjectType.BUSH,
        width: 8,
        height: 8,
        spriteSets: [
            {
                steps: [
                    {
                        filename: 'bush.png',
                        renderPass: RenderPass.BUSHES,
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
        spriteSets: [
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
        spriteSets: [
            ...generateTankSpriteSets(),
            {
                meta: {
                    smoke: TankSmoke.SMALL,
                },
                duration: 480,
                loop: true,
                steps: [
                    {
                        filename: 'smoke_small_0.png',
                        duration: 160,
                        renderPass: RenderPass.SMOKE,
                    },
                    {
                        filename: 'smoke_small_1.png',
                        duration: 160,
                        renderPass: RenderPass.SMOKE,
                    },
                    {
                        filename: 'smoke_small_2.png',
                        duration: 160,
                        renderPass: RenderPass.SMOKE,
                    },
                ],
            },
            {
                meta: {
                    smoke: TankSmoke.BIG,
                },
                duration: 480,
                loop: true,
                steps: [
                    {
                        filename: 'smoke_big_0.png',
                        duration: 160,
                        renderPass: RenderPass.SMOKE,
                    },
                    {
                        filename: 'smoke_big_1.png',
                        duration: 160,
                        renderPass: RenderPass.SMOKE,
                    },
                    {
                        filename: 'smoke_big_2.png',
                        duration: 160,
                        renderPass: RenderPass.SMOKE,
                    },
                ],
            },
        ],
        audioEffects: [
            {
                filename: 'tank_moving.wav',
                loop: true,
                meta: {
                    isMoving: true,
                },
            },
        ],
    },
    {
        type: GameObjectType.BULLET,
        width: 2,
        height: 2,
        spriteSets: [
            {
                direction: Direction.UP,
                meta: {
                    power: BulletPower.LIGHT,
                },
                steps: [
                    {
                        filename: 'bullet_light_up.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
            {
                direction: Direction.RIGHT,
                meta: {
                    power: BulletPower.LIGHT,
                },
                steps: [
                    {
                        filename: 'bullet_light_right.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
            {
                direction: Direction.DOWN,
                meta: {
                    power: BulletPower.LIGHT,
                },
                steps: [
                    {
                        filename: 'bullet_light_down.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
            {
                direction: Direction.LEFT,
                meta: {
                    power: BulletPower.LIGHT,
                },
                steps: [
                    {
                        filename: 'bullet_light_left.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
            {
                direction: Direction.UP,
                meta: {
                    power: BulletPower.HEAVY,
                },
                steps: [
                    {
                        filename: 'bullet_heavy_up.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
            {
                direction: Direction.RIGHT,
                meta: {
                    power: BulletPower.HEAVY,
                },
                steps: [
                    {
                        filename: 'bullet_heavy_right.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
            {
                direction: Direction.DOWN,
                meta: {
                    power: BulletPower.HEAVY,
                },
                steps: [
                    {
                        filename: 'bullet_heavy_down.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
            {
                direction: Direction.LEFT,
                meta: {
                    power: BulletPower.HEAVY,
                },
                steps: [
                    {
                        filename: 'bullet_heavy_left.png',
                        offset: {
                            y: -1,
                            x: -1,
                        },
                        width: 4,
                        height: 4,
                        renderPass: RenderPass.BULLET,
                    },
                ],
            },
        ],
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
        spriteSets: [
            {
                duration: 240,
                loop: false,
                meta: {
                    explosionType: ExplosionType.SMALL,
                },
                steps: [
                    {
                        filename: 'explosion_small_frame_1.png',
                        duration: 80,
                        offset: {
                            y: -8,
                            x: -8,
                        },
                        width: 16,
                        height: 16,
                        renderPass: RenderPass.EXPLOSIONS,
                    },
                    {
                        filename: 'explosion_small_frame_2.png',
                        duration: 80,
                        offset: {
                            y: -8,
                            x: -8,
                        },
                        width: 16,
                        height: 16,
                        renderPass: RenderPass.EXPLOSIONS,
                    },
                    {
                        filename: 'explosion_small_frame_3.png',
                        duration: 80,
                        offset: {
                            y: -8,
                            x: -8,
                        },
                        width: 16,
                        height: 16,
                        renderPass: RenderPass.EXPLOSIONS,
                    },
                ],
            },
            {
                duration: 240,
                loop: false,
                meta: {
                    explosionType: ExplosionType.BIG,
                },
                steps: [
                    {
                        filename: 'explosion_small_frame_3.png',
                        duration: 60,
                        offset: {
                            y: -8,
                            x: -8,
                        },
                        width: 16,
                        height: 16,
                        renderPass: RenderPass.EXPLOSIONS,
                    },
                    {
                        filename: 'explosion_big_frame_1.png',
                        duration: 60,
                        offset: {
                            y: -16,
                            x: -16,
                        },
                        width: 32,
                        height: 32,
                        renderPass: RenderPass.EXPLOSIONS,
                    },
                    {
                        filename: 'explosion_big_frame_2.png',
                        duration: 60,
                        offset: {
                            y: -16,
                            x: -16,
                        },
                        width: 32,
                        height: 32,
                        renderPass: RenderPass.EXPLOSIONS,
                    },
                    {
                        filename: 'explosion_big_frame_1.png',
                        duration: 60,
                        offset: {
                            y: -16,
                            x: -16,
                        },
                        width: 32,
                        height: 32,
                        renderPass: RenderPass.EXPLOSIONS,
                    },
                ],
            },
        ],
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
    {
        type: GameObjectType.ICE,
        shortType: GameShortObjectType.ICE,
        width: 8,
        height: 8,
        spriteSets: [
            {
                steps: [
                    {
                        filename: 'ice.png',
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
}
