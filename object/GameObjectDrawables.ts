import { BulletPower } from '@/bullet/BulletPower';
import AnimatedImageDrawable from '@/drawable/AnimatedImageDrawable';
import IDrawable from '@/drawable/IDrawable';
import ImageDrawable from '@/drawable/ImageDrawable';
import { ExplosionType } from '@/explosion/ExplosionType';
import { Direction } from '@/physics/Direction';
import { TankSmoke } from '@/tank/TankSmoke';
import { TankTier } from '@/tank/TankTier';
import { GameObjectType } from './GameObjectType';
import { RenderPass } from './IGameObjectProperties';

const drawables: Partial<Record<GameObjectType, IDrawable[]>> = {
    [GameObjectType.STEEL_WALL]: [
        new ImageDrawable('steel_wall.png'),
    ],
    [GameObjectType.BUSH]: [
        new ImageDrawable('bush.png', {}, {
            renderPass: RenderPass.BUSHES,
        }),
    ],
    [GameObjectType.LEVEL_BORDER]: [
        new ImageDrawable('level_border.png'),
    ],
    [GameObjectType.ICE]: [
        new ImageDrawable('ice.png'),
    ],
    [GameObjectType.BRICK_WALL]: [
        new ImageDrawable('brick_wall_even.png', {
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
        }),
        new ImageDrawable('brick_wall_odd.png', {
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
        }),
    ],
    [GameObjectType.TANK]: [
        ...((): IDrawable[] => {
            const generateTankTierDirectionFrame = (
                tier: TankTier,
                direction: Direction,
                frame: number,
                isMoving: boolean,
            ) => {
                return new ImageDrawable(`tank_${tier}_${direction}_${frame}.png`, {
                    isTankDrawable: true,
                    isMoving,
                    direction,
                    tier,
                }, {
                    renderPass: RenderPass.TANK,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    overlays: [
                        new ImageDrawable(`tank_${tier}_${direction}_${frame}_highlights.png`, {}, {
                            compositionType: 'lighter',
                            scaleX: 0.5,
                            scaleY: 0.5,
                        }),
                        new ImageDrawable(`tank_${tier}_${direction}_${frame}_shadows.png`, {}, {
                            compositionType: 'difference',
                            scaleX: 0.5,
                            scaleY: 0.5,
                        }),
                    ],
                });
            };

            const drawables = [];

            for (const tier of Object.values(TankTier)) {
                for (const direction of Object.values(Direction)) {
                    drawables.push(
                        new AnimatedImageDrawable([
                            generateTankTierDirectionFrame(tier, direction, 0, true),
                            generateTankTierDirectionFrame(tier, direction, 1, true),
                        ], [
                            62.5,
                            62.5,
                        ], {
                            isTankDrawable: true,
                            isMoving: true,
                            direction,
                            tier,
                        }, true, {
                            renderPass: RenderPass.TANK,
                            scaleX: 0.5,
                            scaleY: 0.5,
                        }),
                    );
                    drawables.push(
                        generateTankTierDirectionFrame(tier, direction, 0, false),
                    );
                }
            }

            return drawables;
        })(),
        ...((): IDrawable[] => {
            const drawables = [];

            for (const smoke of Object.values(TankSmoke)) {
                drawables.push(
                    new AnimatedImageDrawable([
                        new ImageDrawable(`smoke_${smoke}_0.png`),
                        new ImageDrawable(`smoke_${smoke}_1.png`),
                        new ImageDrawable(`smoke_${smoke}_2.png`),
                    ], [
                        160,
                        160,
                        160,
                    ], {
                        smoke,
                    }, true, {
                        renderPass: RenderPass.SMOKE,
                    }),
                );
            }

            return drawables;
        })(),
    ],
    [GameObjectType.BULLET]: [
        ...((): IDrawable[] => {
            const drawables = [];

            for (const power of Object.values(BulletPower)) {
                for (const direction of Object.values(Direction)) {
                    drawables.push(
                        new ImageDrawable(`bullet_${power}_${direction}.png`, {
                            direction,
                            power,
                        }, {
                            renderPass: RenderPass.BULLET,
                            offsetX: -2,
                            offsetY: -2,
                            scaleX: 0.5,
                            scaleY: 0.5,
                        }),
                    );
                }
            }

            return drawables;
        })(),
    ],
    [GameObjectType.EXPLOSION]: [
        new AnimatedImageDrawable([
            new ImageDrawable('explosion_small_0.png'),
            new ImageDrawable('explosion_small_1.png'),
            new ImageDrawable('explosion_small_2.png'),
        ], [
            80,
            80,
            80,
        ], {
            explosionType: ExplosionType.SMALL,
        }, false, {
            renderPass: RenderPass.EXPLOSIONS,
            offsetX: -8,
            offsetY: -8,
        }),
        new AnimatedImageDrawable([
            new ImageDrawable('explosion_big_0.png'),
            new ImageDrawable('explosion_big_1.png'),
            new ImageDrawable('explosion_big_2.png'),
        ], [
            80,
            80,
            80,
        ], {
            explosionType: ExplosionType.BIG,
        }, false, {
            renderPass: RenderPass.EXPLOSIONS,
            offsetX: -16,
            offsetY: -16,
        }),
    ],
};

export default class GameObjectDrawables {
    static getTypeDrawables(type: GameObjectType): IDrawable[] | undefined {
        return drawables[type];
    }
}
