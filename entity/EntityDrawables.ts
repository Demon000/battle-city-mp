import { BulletPower } from '@/bullet/BulletPower';
import { BulletComponent } from '@/components/BulletComponent';
import { ColorComponent } from '@/components/ColorComponent';
import { IsMovingComponent } from '@/components/IsMovingComponent';
import { IsUnderBushComponent } from '@/components/IsUnderBushComponent';
import { AnimatedImageDrawable } from '@/drawable/AnimatedImageDrawable';
import { IDrawable, DrawableProcessingFunction, DrawableTestFunction } from '@/drawable/IDrawable';
import { IImageDrawable } from '@/drawable/IImageDrawable';
import { ImageDrawable } from '@/drawable/ImageDrawable';
import { TextDrawable, TextPositionReference } from '@/drawable/TextDrawable';
import { Entity } from '@/ecs/Entity';
import { ExplosionType } from '@/explosion/ExplosionType';
import { Direction } from '@/physics/Direction';
import { DirectionComponent } from '@/components/DirectionComponent';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { TankTier } from '@/tank/TankTier';
import { EntityType } from './EntityType';
import { RenderPass } from './RenderPass';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { RelativePositionComponent } from '@/components/RelativePositionComponent';

const directionTest = (targetDirection: Direction): DrawableTestFunction => {
    return (entity: Entity): boolean => {
        const direction = entity.getComponent(DirectionComponent).value;
        return direction === targetDirection;
    };
};

const drawables: Partial<Record<string, IDrawable[]>> = {
    [EntityType.STEEL_WALL]: [
        new ImageDrawable('steel_wall.png', {
            renderPass: RenderPass.WALL,
        }),
    ],
    [EntityType.BUSH]: [
        new ImageDrawable('bush.png', {
            renderPass: RenderPass.BUSHES,
        }),
    ],
    [EntityType.LEVEL_BORDER]: [
        new ImageDrawable('level_border.png', {
            renderPass: RenderPass.WALL,
        }),
    ],
    [EntityType.ICE]: [
        new ImageDrawable('ice.png', {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [EntityType.SAND]: [
        new ImageDrawable('sand.png', {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [EntityType.WATER]: [
        new AnimatedImageDrawable([
            new ImageDrawable('water_0.png'),
            new ImageDrawable('water_1.png'),
            new ImageDrawable('water_2.png'),
        ], [
            1000,
            1000,
            1000,
        ], true, {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [EntityType.BRICK_WALL]: [
        new ImageDrawable('brick_wall.png', {
            renderPass: RenderPass.WALL,
            fillRepeatWidth: 8,
            fillRepeatHeight: 8,
        }),
    ],
    [EntityType.GRASS]: [
        new ImageDrawable('grass.png', {
            renderPass: RenderPass.GROUND,
            fillRepeatWidth: 16,
            fillRepeatHeight: 16,
        }),
    ],
    [EntityType.DIRT]: [
        new ImageDrawable('dirt.png', {
            renderPass: RenderPass.GROUND,
            fillRepeatWidth: 16,
            fillRepeatHeight: 16,
        }),
    ],
    [EntityType.FLAG_BASE]: [
        new ImageDrawable('flag_base.png', {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [EntityType.FLAG]: [
        new ImageDrawable('flag_pole.png', {
            renderPass: RenderPass.ABOVE_WALL,
            offsetX: 7,
            offsetY: -15,
            tests: [
                (entity: Entity): boolean => {
                    return !entity.hasComponent(RelativePositionComponent);
                },
            ],
        }),
        new ImageDrawable('flag_cloth.png', {
            renderPass: RenderPass.ABOVE_WALL,
            offsetX: 8,
            offsetY: -15,
            processor: function (entity: Entity) {
                const drawable = this as IImageDrawable;
                const color = entity.getComponent(ColorComponent).value;
                return drawable.colorMask(color);
            },
            tests: [
                (entity: Entity): boolean => {
                    return !entity.hasComponent(RelativePositionComponent);
                },
            ],
            overlays: [
                new ImageDrawable('flag_cloth_shadows.png', {
                    renderPass: RenderPass.ABOVE_WALL,
                    compositionType: 'difference',
                }),
            ],
        }),
        new ImageDrawable('flag_pole_tank.png', {
            renderPass: RenderPass.ABOVE_WALL,
            offsetX: 8,
            offsetY: -5,
            tests: [
                (entity: Entity): boolean => {
                    return entity.hasComponent(RelativePositionComponent);
                },
            ],
        }),
        new ImageDrawable('flag_cloth.png', {
            renderPass: RenderPass.ABOVE_WALL,
            offsetX: 9,
            offsetY: -5,
            processor: function (entity: Entity) {
                const drawable = this as IImageDrawable;
                const color = entity.getComponent(ColorComponent).value;
                return drawable.colorMask(color);
            },
            tests: [
                (entity: Entity): boolean => {
                    return entity.hasComponent(RelativePositionComponent);
                },
            ],
            overlays: [
                new ImageDrawable('flag_cloth_shadows.png', {
                    renderPass: RenderPass.ABOVE_WALL,
                    compositionType: 'difference',
                }),
            ],
        }),
    ],
    [EntityType.TANK]: [
        ...((): IDrawable[] => {
            const tankDrawableScale = 0.5;

            const tankDrawableTests = (
                tier: TankTier,
                direction: Direction,
                targetIsMoving: boolean,
            ) => {
                return [
                    directionTest(direction),
                    (entity: Entity): boolean => {
                        const isMoving = entity.hasComponent(IsMovingComponent);

                        if (isMoving !== targetIsMoving) {
                            return false;
                        }

                        if (entity.subtypes[0] !== tier) {
                            return false;
                        }

                        return true;
                    },
                ];
            };

            const tankColorProcessor: DrawableProcessingFunction
                = function (entity: Entity) {
                    const drawable = this as IImageDrawable;
                    const color = entity.getComponent(ColorComponent).value;
                    return drawable.colorMask(color);
                };

            const tankDrawableFrame = (
                tier: TankTier,
                direction: Direction,
                isMoving: boolean,
                frame: number,
            ) => {
                const source = (ext: string) =>
                    `tank_${tier}_${direction}_${frame}${ext}.png`;
                return new ImageDrawable(source(''), {
                    renderPass: RenderPass.WALL,
                    scaleX: tankDrawableScale,
                    scaleY: tankDrawableScale,
                    tests: tankDrawableTests(tier, direction, isMoving),
                    processor: tankColorProcessor,
                    overlays: [
                        new ImageDrawable(source('_highlights'), {
                            compositionType: 'lighter',
                            scaleX: tankDrawableScale,
                            scaleY: tankDrawableScale,
                        }),
                        new ImageDrawable(source('_shadows'), {
                            compositionType: 'difference',
                            scaleX: tankDrawableScale,
                            scaleY: tankDrawableScale,
                        }),
                    ],
                });
            };

            const drawables = [];

            for (const tier of Object.values(TankTier)) {
                for (const direction of Object.values(Direction)) {
                    drawables.push(
                        new AnimatedImageDrawable([
                            tankDrawableFrame(tier, direction, true, 0),
                            tankDrawableFrame(tier, direction, true, 1),
                        ], [
                            62.5,
                            62.5,
                        ], true, {
                            tests: tankDrawableTests(tier, direction, true),
                            processor: tankColorProcessor,
                            renderPass: RenderPass.WALL,
                            scaleX: tankDrawableScale,
                            scaleY: tankDrawableScale,
                        }),
                    );
                    drawables.push(
                        tankDrawableFrame(tier, direction, false, 0),
                    );
                }
            }

            return drawables;
        })(),
        new TextDrawable('', {
            renderPass: RenderPass.BELOW_BUSH,
            fontFamily: 'Press Start 2P',
            fontUrl: 'press_start_2p.ttf',
            fontColor: [255, 255, 255],
            fontSize: 2,
            backgroundColor: [0, 0, 0],
            backgroundAlpha: 0.6,
            paddingX: 1,
            paddingY: 1,
            positionXReference: 'center',
            tests: [
                (entity: Entity): boolean => {
                    const isUnderBush = entity
                        .hasComponent(IsUnderBushComponent);

                    if (isUnderBush) {
                        return false;
                    }

                    return true;
                },
            ],
            processor(this: IDrawable, entity: Entity): IDrawable | undefined {
                let drawable: TextDrawable | undefined = this as TextDrawable;

                const playerName = entity
                    .getComponent(PlayerOwnedComponent).playerName;
                if (playerName === undefined) {
                    return drawable;
                }

                drawable = drawable.withText(playerName);
                if (drawable === undefined) {
                    return drawable;
                }

                const position = entity
                    .getComponent(PositionComponent);
                const centerPosition = entity
                    .getComponent(CenterPositionComponent);
                const size = entity
                    .getComponent(SizeComponent);
                const direction = entity
                    .getComponent(DirectionComponent).value;

                const offsetX = centerPosition.x - position.x;

                let offsetY = 0;
                let positionYReference: TextPositionReference | undefined;
                if (direction === Direction.UP) {
                    offsetY = size.height;
                    positionYReference = undefined;
                } else {
                    positionYReference = 'end';
                }

                if (positionYReference !== undefined) {
                    drawable = (drawable as TextDrawable)
                        .positionYReference(positionYReference);
                }

                if (drawable === undefined) {
                    return drawable;
                }

                return drawable.offset(offsetX, offsetY);
            },
        }),
    ],
    [EntityType.SMOKE]: [
        new AnimatedImageDrawable([
            new ImageDrawable('smoke_0.png'),
            new ImageDrawable('smoke_1.png'),
            new ImageDrawable('smoke_2.png'),
        ], [
            250,
            250,
            250,
        ], false, {
            renderPass: RenderPass.ABOVE_BUSH,
            offsetX: -8,
            offsetY: -8,
        }),
    ],
    [EntityType.BULLET]: [
        ...((): IDrawable[] => {
            const drawables = [];

            for (const power of Object.values(BulletPower)) {
                const bulletPowerTest = (entity: Entity) => {
                    const bulletPower = entity
                        .getComponent(BulletComponent).power;

                    if (bulletPower !== power) {
                        return false;
                    }

                    return true;
                };

                for (const direction of Object.values(Direction)) {
                    drawables.push(
                        new ImageDrawable(`bullet_${power}_${direction}.png`, {
                            renderPass: RenderPass.WALL,
                            offsetX: -2,
                            offsetY: -2,
                            scaleX: 0.5,
                            scaleY: 0.5,
                            tests: [
                                directionTest(direction),
                                bulletPowerTest,
                            ],
                        }),
                    );
                }
            }

            return drawables;
        })(),
    ],
    [EntityType.EXPLOSION]: [
        ...((): IDrawable[] => {
            const drawables = [];

            const generateExplosionDrawableTests = (
                type: string,
            ) => [
                (entity: Entity): boolean => {
                    const explosionType = entity.subtypes[0];

                    if (explosionType !== type) {
                        return false;
                    }

                    return true;
                },
            ];

            const generateExplosionDrawableFrame = (
                type: string,
                frame: number,
            ) => new ImageDrawable(`explosion_${type}_${frame}.png`);

            drawables.push(
                new AnimatedImageDrawable([
                    generateExplosionDrawableFrame(ExplosionType.SMALL, 0),
                    generateExplosionDrawableFrame(ExplosionType.SMALL, 1),
                    generateExplosionDrawableFrame(ExplosionType.SMALL, 2),
                ], [
                    80,
                    80,
                    80,
                ], false, {
                    tests: generateExplosionDrawableTests(ExplosionType.SMALL),
                    renderPass: RenderPass.ABOVE_BUSH,
                    offsetX: -8,
                    offsetY: -8,
                }),
            );

            drawables.push(
                new AnimatedImageDrawable([
                    generateExplosionDrawableFrame(ExplosionType.BIG, 0),
                    generateExplosionDrawableFrame(ExplosionType.BIG, 1),
                    generateExplosionDrawableFrame(ExplosionType.BIG, 2),
                ], [
                    80,
                    80,
                    80,
                ], false, {
                    tests: generateExplosionDrawableTests(ExplosionType.BIG),
                    renderPass: RenderPass.ABOVE_BUSH,
                    offsetX: -16,
                    offsetY: -16,
                }),
            );

            return drawables;
        })(),
    ],
};

export class EntityDrawables {
    static getTypeDrawables(type: string): IDrawable[] | undefined {
        return drawables[type];
    }
}
