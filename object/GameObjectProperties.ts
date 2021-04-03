import { ExplosionType } from '@/explosion/ExplosionType';
import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';
import { TankTier } from '@/tank/TankTier';
import GameObject from './GameObject';
import { GameObjectType, GameShortObjectType } from './GameObjectType';
import IGameObjectProperties, { IAudioEffect, ISprite, ISpriteSet, RenderPass, ResourceMeta } from './IGameObjectProperties';

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

const tankAnimationDuration = 125;
const tankMovingMeta = {
    isMoving: true,
};
const generateTankTierSpriteSets = (tier: TankTier): ISpriteSet[] => {
    const sets = new Array<ISpriteSet>();

    for (const direction of Object.values(Direction)) {
        sets.push(
            generateTankTierSpriteSet(direction, tier, 2, tankAnimationDuration, tankMovingMeta),
            generateTankTierSpriteSet(direction, tier, 1),
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
        spriteSets: generateTankSpriteSets(),
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
                steps: [
                    {
                        filename: 'bullet_up.png',
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
                steps: [
                    {
                        filename: 'bullet_right.png',
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
                steps: [
                    {
                        filename: 'bullet_down.png',
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
                steps: [
                    {
                        filename: 'bullet_left.png',
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
        spriteSets: [
            {
                duration: 180,
                loop: false,
                meta: {
                    explosionType: ExplosionType.SMALL,
                },
                steps: [
                    {
                        filename: 'explosion_small_frame_1.png',
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
                        filename: 'explosion_small_frame_2.png',
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
                    destroyedObjectType: GameObjectType.LEVEL_BORDER,
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

    static findSpriteSets(object: GameObject): ISpriteSet[] {
        const properties = this.getTypeProperties(object.type);
        if (properties.spriteSets === undefined) {
            return [];
        }

        return properties.spriteSets;
    }

    static isSpriteSetMatchingPosition(set: ISpriteSet, position: Point): boolean {
        if (set.position === undefined) {
            return true;
        }

        const x = position.x % set.position.mod / set.position.divide;
        const y = position.y % set.position.mod / set.position.divide;

        for (const point of set.position.equals) {
            if (point.x === x && point.y === y) {
                return true;
            }
        }

        return false;
    }

    static isSpriteSetMatchingDirection(set: ISpriteSet, direction: Direction): boolean {
        if (set.direction === undefined) {
            return true;
        }

        return set.direction === direction;
    }

    static findSpriteSet(object: GameObject): ISpriteSet | undefined {
        const sets = this.findSpriteSets(object);
        for (const set of sets) {
            if (!this.isSpriteSetMatchingDirection(set, object.direction)) {
                continue;
            }

            if (!this.isSpriteSetMatchingPosition(set, object.position)) {
                continue;
            }

            if (set.meta !== undefined && !object.isMatchingMeta(set.meta)) {
                continue;
            }

            return set;
        }

        return undefined;
    }

    static findAnimationSprite(set: ISpriteSet, referenceTime: number): ISprite | undefined {
        if (set.duration === undefined) {
            throw new Error('Invalid call to find animation sprite when sprite set is not animated');
        }

        let currentAnimationTime = (Date.now() - referenceTime);
        if (set.loop === undefined || set.loop === true) {
            currentAnimationTime %= set.duration;
        }

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
        const spriteSet = this.findSpriteSet(object);
        if (spriteSet === undefined) {
            return undefined;
        }

        if (spriteSet.duration === undefined) {
            return spriteSet.steps[0];
        }

        return this.findAnimationSprite(spriteSet, object.spawnTime);
    }

    static findAudioEffects(object: GameObject): IAudioEffect[] {
        const properties = this.getTypeProperties(object.type);
        if (properties.audioEffects === undefined) {
            return [];
        }

        return properties.audioEffects;
    }

    static findAudioEffect(object: GameObject): IAudioEffect | undefined {
        const audioEffects = this.findAudioEffects(object);

        for (const audioEffect of audioEffects) {
            if (audioEffect.meta !== undefined && !object.isMatchingMeta(audioEffect.meta)) {
                continue;
            }

            return audioEffect;
        }

        return undefined;
    }
}
