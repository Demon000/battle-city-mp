import { BulletPower } from '@/bullet/BulletPower';
import AnimatedImageDrawable from '@/drawable/AnimatedImageDrawable';
import IDrawable from '@/drawable/IDrawable';
import ImageDrawable from '@/drawable/ImageDrawable';
import TextDrawable from '@/drawable/TextDrawable';
import { ExplosionType } from '@/explosion/ExplosionType';
import { Direction } from '@/physics/Direction';
import { TankTier } from '@/tank/TankTier';
import { GameObjectType } from './GameObjectType';
import { RenderPass } from './IGameObjectProperties';

const drawables: Partial<Record<GameObjectType, IDrawable[]>> = {
    [GameObjectType.STEEL_WALL]: [
        new ImageDrawable('steel_wall.png', {}, {
            renderPass: RenderPass.WALL,
        }),
    ],
    [GameObjectType.BUSH]: [
        new ImageDrawable('bush.png', {}, {
            renderPass: RenderPass.BUSHES,
        }),
    ],
    [GameObjectType.LEVEL_BORDER]: [
        new ImageDrawable('level_border.png', {}, {
            renderPass: RenderPass.WALL,
        }),
    ],
    [GameObjectType.ICE]: [
        new ImageDrawable('ice.png', {}, {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [GameObjectType.SAND]: [
        new ImageDrawable('sand.png', {}, {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [GameObjectType.WATER]: [
        new AnimatedImageDrawable([
            new ImageDrawable('water_0.png'),
            new ImageDrawable('water_1.png'),
            new ImageDrawable('water_2.png'),
        ], [
            500,
            500,
            500,
        ], {}, true, {
            renderPass: RenderPass.GROUND,
        }),
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
        }, {
            renderPass: RenderPass.WALL,
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
        }, {
            renderPass: RenderPass.WALL,
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
                    isTank: true,
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
                            isTank: true,
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
        new TextDrawable('', {
            isText: true,
        }, {
            renderPass: RenderPass.TANK_NAME,
            fontFamily: 'Press Start 2P',
            fontUrl: 'press_start_2p.ttf',
            fontColor: [255, 255, 255],
            fontSize: 8,
            backgroundColor: [0, 0, 0],
            backgroundAlpha: 0.6,
            paddingX: 1,
            paddingY: 1,
            positionXReference: 'center',
        }),
    ],
    [GameObjectType.SMOKE]: [
        new AnimatedImageDrawable([
            new ImageDrawable('smoke_0.png'),
            new ImageDrawable('smoke_1.png'),
            new ImageDrawable('smoke_2.png'),
        ], [
            250,
            250,
            250,
        ], {}, false, {
            renderPass: RenderPass.SMOKE,
            offsetX: -8,
            offsetY: -8,
        }),
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
