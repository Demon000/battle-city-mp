import { BulletPower } from '@/bullet/BulletPower';
import { BulletComponent } from '@/bullet/BulletComponent';
import { ColorComponent } from '@/components/ColorComponent';
import { IsMovingComponent } from '@/components/IsMovingComponent';
import { IsUnderBushComponent } from '@/components/IsUnderBushComponent';
import { AnimatedImageDrawable } from '@/drawable/AnimatedImageDrawable';
import { IDrawable, DrawableProcessingFunction, DrawableTestFunction } from '@/drawable/IDrawable';
import { IImageDrawable } from '@/drawable/IImageDrawable';
import { ImageDrawable } from '@/drawable/ImageDrawable';
import { TextDrawable, TextPositionReference } from '@/drawable/TextDrawable';
import { Entity } from '@/ecs/Entity';
import { Explosion } from '@/explosion/Explosion';
import { ExplosionType } from '@/explosion/ExplosionType';
import { FlagType } from '@/flag/FlagType';
import { Direction } from '@/physics/Direction';
import { DirectionComponent } from '@/physics/DirectionComponent';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { Point } from '@/physics/point/Point';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';
import { Tank } from '@/tank/Tank';
import { TankTier } from '@/tank/TankTier';
import { GameObject } from './GameObject';
import { GameObjectType } from './GameObjectType';
import { RenderPass } from './RenderPass';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { FlagComponent } from '@/flag/FlagComponent';

const positionTest = (mod: number, divide: number, points: Point[]): DrawableTestFunction => {
    return (entity: Entity): boolean => {
        const position = entity.getComponent(PositionComponent);
        const x = Math.floor(Math.abs(position.x % mod / divide));
        const y = Math.floor(Math.abs(position.y % mod / divide));
        return points.some(p => p.x === x && p.y === y);
    };
};

const directionTest = (targetDirection: Direction): DrawableTestFunction => {
    return (entity: Entity): boolean => {
        const direction = entity.getComponent(DirectionComponent).value;
        return direction === targetDirection;
    };
};

const drawables: Partial<Record<string, IDrawable[]>> = {
    [GameObjectType.STEEL_WALL]: [
        new ImageDrawable('steel_wall.png', {
            renderPass: RenderPass.WALL,
        }),
    ],
    [GameObjectType.BUSH]: [
        new ImageDrawable('bush.png', {
            renderPass: RenderPass.BUSHES,
        }),
    ],
    [GameObjectType.LEVEL_BORDER]: [
        new ImageDrawable('level_border.png', {
            renderPass: RenderPass.WALL,
        }),
    ],
    [GameObjectType.ICE]: [
        new ImageDrawable('ice.png', {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [GameObjectType.SAND]: [
        new ImageDrawable('sand.png', {
            renderPass: RenderPass.GROUND,
        }),
    ],
    [GameObjectType.WATER]: [
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
    [GameObjectType.BRICK_WALL]: [
        new ImageDrawable('brick_wall_even.png', {
            renderPass: RenderPass.WALL,
            tests: [
                positionTest(8, 4, [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ]),
            ],
        }),
        new ImageDrawable('brick_wall_odd.png', {
            renderPass: RenderPass.WALL,
            tests: [
                positionTest(8, 4, [
                    { x: 0, y: 1 },
                    { x: 1, y: 0 },
                ]),
            ],
        }),
    ],
    [GameObjectType.GRASS]: [
        new ImageDrawable('grass_even.png', {
            renderPass: RenderPass.GROUND,
            tests: [
                positionTest(16, 8, [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ]),
            ],
        }),
        new ImageDrawable('grass_odd.png', {
            renderPass: RenderPass.GROUND,
            tests: [
                positionTest(16, 8, [
                    { x: 0, y: 1 },
                    { x: 1, y: 0 },
                ]),
            ],
        }),
    ],
    [GameObjectType.DIRT]: [
        new ImageDrawable('dirt_tl.png', {
            renderPass: RenderPass.GROUND,
            tests: [
                positionTest(16, 8, [
                    { x: 0, y: 0 },
                ]),
            ],
        }),
        new ImageDrawable('dirt_tr.png', {
            renderPass: RenderPass.GROUND,
            tests: [
                positionTest(16, 8, [
                    { x: 1, y: 0 },
                ]),
            ],
        }),
        new ImageDrawable('dirt_bl.png', {
            renderPass: RenderPass.GROUND,
            tests: [
                positionTest(16, 8, [
                    { x: 0, y: 1 },
                ]),
            ],
        }),
        new ImageDrawable('dirt_br.png', {
            renderPass: RenderPass.GROUND,
            tests: [
                positionTest(16, 8, [
                    { x: 1, y: 1 },
                ]),
            ],
        }),
    ],
    [GameObjectType.FLAG]: [
        new ImageDrawable('flag_base.png', {
            renderPass: RenderPass.FLAG_BASE,
            offsetX: 2,
            offsetY: 2,
            tests: [
                (entity: Entity): boolean => {
                    const flagComponent = entity.getComponent(FlagComponent);

                    if (flagComponent.type !== FlagType.FULL
                        && flagComponent.type !== FlagType.BASE_ONLY) {
                        return false;
                    }

                    return true;
                },
            ],
        }),
        new ImageDrawable('flag_pole.png', {
            renderPass: RenderPass.FLAG_POLE,
            offsetX: 7,
            offsetY: -15,
            tests: [
                (entity: Entity): boolean => {
                    const flagComponent = entity.getComponent(FlagComponent);

                    if (flagComponent.type !== FlagType.FULL
                        && flagComponent.type !== FlagType.POLE_ONLY) {
                        return false;
                    }

                    return true;
                },
            ],
        }),
        new ImageDrawable('flag_cloth.png', {
            renderPass: RenderPass.FLAG_POLE,
            offsetX: 8,
            offsetY: -15,
            processor: function (entity: Entity) {
                const drawable = this as IImageDrawable;
                const color = entity.getComponent(ColorComponent).value;
                return drawable.colorMask(color);
            },
            tests: [
                (entity: Entity): boolean => {
                    const flagComponent = entity.getComponent(FlagComponent);

                    if (flagComponent.type !== FlagType.FULL
                        && flagComponent.type !== FlagType.POLE_ONLY) {
                        return false;
                    }

                    return true;
                },
            ],
            overlays: [
                new ImageDrawable('flag_cloth_shadows.png', {
                    renderPass: RenderPass.FLAG_POLE,
                    compositionType: 'difference',
                }),
            ],
        }),
    ],
    [GameObjectType.TANK]: [
        ...((): IDrawable[] => {
            const generateTankDrawableTests = (
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

            const tankColorProcessor: DrawableProcessingFunction = function (entity: Entity) {
                const drawable = this as IImageDrawable;
                const color = entity.getComponent(ColorComponent).value;
                return drawable.colorMask(color);
            };

            const generateTankDrawableFrame = (
                tier: TankTier,
                direction: Direction,
                isMoving: boolean,
                frame: number,
            ) => {
                return new ImageDrawable(`tank_${tier}_${direction}_${frame}.png`, {
                    renderPass: RenderPass.TANK,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    tests: generateTankDrawableTests(tier, direction, isMoving),
                    processor: tankColorProcessor,
                    overlays: [
                        new ImageDrawable(`tank_${tier}_${direction}_${frame}_highlights.png`, {
                            compositionType: 'lighter',
                            scaleX: 0.5,
                            scaleY: 0.5,
                        }),
                        new ImageDrawable(`tank_${tier}_${direction}_${frame}_shadows.png`, {
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
                            generateTankDrawableFrame(tier, direction, true, 0),
                            generateTankDrawableFrame(tier, direction, true, 1),
                        ], [
                            62.5,
                            62.5,
                        ], true, {
                            tests: generateTankDrawableTests(tier, direction, true),
                            processor: tankColorProcessor,
                            renderPass: RenderPass.TANK,
                            scaleX: 0.5,
                            scaleY: 0.5,
                        }),
                    );
                    drawables.push(
                        generateTankDrawableFrame(tier, direction, false, 0),
                    );
                }
            }

            return drawables;
        })(),
        new TextDrawable('', {
            renderPass: RenderPass.TANK_NAME,
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
                    const isUnderBush
                        = entity.getComponent(IsUnderBushComponent).value;

                    if (isUnderBush) {
                        return false;
                    }

                    return true;
                },
            ],
            processor(this: IDrawable, entity: Entity): IDrawable | undefined {
                let drawable: TextDrawable | undefined = this as TextDrawable;

                const playerName =
                    entity.getComponent(PlayerOwnedComponent).playerName;
                if (playerName === undefined) {
                    return drawable;
                }

                drawable = drawable.withText(playerName);
                if (drawable === undefined) {
                    return drawable;
                }

                const position = entity.getComponent(PositionComponent);
                const centerPosition = entity.getComponent(CenterPositionComponent);
                const size = entity.getComponent(SizeComponent);
                const direction = entity.getComponent(DirectionComponent).value;
                const offsetX = centerPosition.x - position.x;
                let offsetY = 0;
                let positionYReference: TextPositionReference | undefined = 'end';
                if (direction === Direction.UP) {
                    offsetY = size.height;
                    positionYReference = undefined;
                }

                if (positionYReference !== undefined) {
                    drawable = (drawable as TextDrawable).positionYReference(positionYReference);
                }

                if (drawable === undefined) {
                    return drawable;
                }

                return drawable.offset(offsetX, offsetY);
            },
        }),
        new ImageDrawable('flag_pole_tank.png', {
            renderPass: RenderPass.FLAG_POLE,
            offsetX: 8,
            offsetY: -5,
            tests: [
                (object: GameObject): boolean => {
                    const tank = object as Tank;

                    if (tank.flagColor === null) {
                        return false;
                    }

                    return true;
                },
            ],
        }),
        new ImageDrawable('flag_cloth.png', {
            renderPass: RenderPass.FLAG_POLE,
            offsetX: 9,
            offsetY: -5,
            processor: function (object: GameObject) {
                const tank = object as Tank;
                if (tank.flagColor === null) {
                    return this;
                }

                const drawable = this as IImageDrawable;
                return drawable.colorMask(tank.flagColor);
            },
            tests: [
                (object: GameObject): boolean => {
                    const tank = object as Tank;
                    if (tank.flagColor === null) {
                        return false;
                    }

                    return true;
                },
            ],
            overlays: [
                new ImageDrawable('flag_cloth_shadows.png', {
                    renderPass: RenderPass.FLAG_POLE,
                    compositionType: 'difference',
                }),
            ],
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
        ], false, {
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
                            renderPass: RenderPass.BULLET,
                            offsetX: -2,
                            offsetY: -2,
                            scaleX: 0.5,
                            scaleY: 0.5,
                            tests: [
                                directionTest(direction),
                                (entity: Entity): boolean => {
                                    const bulletPower = entity
                                        .getComponent(BulletComponent).power;

                                    if (bulletPower !== power) {
                                        return false;
                                    }

                                    return true;
                                },
                            ],
                        }),
                    );
                }
            }

            return drawables;
        })(),
    ],
    [GameObjectType.EXPLOSION]: [
        ...((): IDrawable[] => {
            const drawables = [];

            const generateExplosionDrawableTests = (
                type: string,
            ) => [
                (object: GameObject): boolean => {
                    const explosion = object as Explosion;

                    if (explosion.explosionType !== type) {
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
                    renderPass: RenderPass.EXPLOSIONS,
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
                    renderPass: RenderPass.EXPLOSIONS,
                    offsetX: -16,
                    offsetY: -16,
                }),
            );

            return drawables;
        })(),
    ],
};

export class GameObjectDrawables {
    static getTypeDrawables(type: string): IDrawable[] | undefined {
        return drawables[type];
    }
}
