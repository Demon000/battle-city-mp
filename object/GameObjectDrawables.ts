import { BulletPower } from '@/bullet/BulletPower';
import AnimatedDrawable from '@/drawable/AnimatedDrawable';
import Drawable from '@/drawable/Drawable';
import IDrawable from '@/drawable/IDrawable';
import { ExplosionType } from '@/explosion/ExplosionType';
import { Direction } from '@/physics/Direction';
import { TankSmoke } from '@/tank/TankSmoke';
import { TankTier } from '@/tank/TankTier';
import { GameObjectType } from './GameObjectType';
import { RenderPass } from './IGameObjectProperties';

const drawables: Partial<Record<GameObjectType, IDrawable[]>> = {
    [GameObjectType.STEEL_WALL]: [
        new Drawable('steel_wall.png'),
    ],
    [GameObjectType.BUSH]: [
        new Drawable('bush.png', {}, {
            renderPass: RenderPass.BUSHES,
        }),
    ],
    [GameObjectType.LEVEL_BORDER]: [
        new Drawable('level_border.png'),
    ],
    [GameObjectType.ICE]: [
        new Drawable('ice.png'),
    ],
    [GameObjectType.BRICK_WALL]: [
        new Drawable('brick_wall_even.png', {
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
        new Drawable('brick_wall_odd.png', {
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
                return new Drawable(`tank_${tier}_${direction}_${frame}.png`, {
                    isTankDrawable: true,
                    isMoving,
                    direction,
                    tier,
                }, {
                    renderPass: RenderPass.TANK,
                    width: 16,
                    height: 16,
                    overlays: [
                        new Drawable(`tank_${tier}_${direction}_${frame}_highlights.png`, {}, {
                            compositionType: 'screen',
                        }),
                        new Drawable(`tank_${tier}_${direction}_${frame}_shadows.png`, {}, {
                            compositionType: 'multiply',
                        }),
                    ],
                });
            };

            const drawables = [];

            for (const tier of Object.values(TankTier)) {
                for (const direction of Object.values(Direction)) {
                    drawables.push(
                        new AnimatedDrawable([
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
                            width: 16,
                            height: 16,
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
                    new AnimatedDrawable([
                        new Drawable(`smoke_${smoke}_0.png`),
                        new Drawable(`smoke_${smoke}_1.png`),
                        new Drawable(`smoke_${smoke}_2.png`),
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
                        new Drawable(`bullet_${power}_${direction}.png`, {
                            direction,
                            power,
                        }, {
                            renderPass: RenderPass.BULLET,
                            offsetX: -1,
                            offsetY: -1,
                            width: 4,
                            height: 4,
                        }),
                    );
                }
            }

            return drawables;
        })(),
    ],
    [GameObjectType.EXPLOSION]: [
        new AnimatedDrawable([
            new Drawable('explosion_small_0.png'),
            new Drawable('explosion_small_1.png'),
            new Drawable('explosion_small_2.png'),
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
        new AnimatedDrawable([
            new Drawable('explosion_big_0.png'),
            new Drawable('explosion_big_1.png'),
            new Drawable('explosion_big_2.png'),
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
