import Point from '@/physics/point/Point';
import BaseImageDrawable from './BaseImageDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import IDrawable from './IDrawable';
import { IImageDrawable, ImageDrawableProperties } from './IImageDrawable';

export default class AnimatedImageDrawable extends BaseImageDrawable {
    readonly type = DrawableType.ANIMATED_IMAGE;

    drawables;
    durations;
    totalDuration;
    loop;

    constructor(
        drawables: IImageDrawable[],
        durations: number[],
        loop = true,
        properties: ImageDrawableProperties = {},
    ) {
        super();

        if (drawables.length !== durations.length) {
            throw new Error('Timings do not match animated drawables');
        }

        this.drawables = drawables;
        this.durations = durations;
        this.loop = loop;
        this.totalDuration = durations.reduce((sum, timing) => sum + timing, 0);
        this.ownProperties = properties;
        this.updateDrawablesInheritedProperties();
    }

    getCurrentDrawable(referenceTime: number): IImageDrawable | undefined {
        let currentAnimationTime = (Date.now() - referenceTime);
        if (this.loop === true) {
            currentAnimationTime %= this.totalDuration;
        }

        let iterationAnimationTime = 0;
        for (let i = 0; i < this.drawables.length; i++) {
            const drawable = this.drawables[i];
            const duration = this.durations[i];

            if (currentAnimationTime < iterationAnimationTime + duration) {
                return drawable;
            }

            iterationAnimationTime += duration;
        }

        return undefined;
    }

    private updateDrawablesInheritedProperties(): void {
        for (const drawable of this.drawables) {
            drawable.setInheritedProperties(this.ownProperties);
        }
    }

    setInheritedProperties(properties: ImageDrawableProperties): void {
        this.ownProperties = properties;
        this.updateDrawablesInheritedProperties();
    }

    isDrawableLoaded(drawable: IDrawable): boolean {
        return drawable.isLoaded();
    }

    isLoaded(): boolean {
        return this.drawables.every(this.isDrawableLoaded);
    }

    getRenderPass(): number {
        throw new Error('Cannot get render pass of animated image drawable');
    }

    draw(_context: CanvasRenderingContext2D, _drawX: number, _drawY: number): void {
        throw new Error('Cannot draw animated image drawable');
    }

    getMinPoint(): Point {
        throw new Error('Cannot get min point of animated image drawable');
    }

    getMaxPoint(): Point {
        throw new Error('Cannot get max point of animated image drawable');
    }

    private copy(drawables: IImageDrawable[]): this {
        return new (<any>this.constructor)(
            drawables,
            this.durations,
            this.loop,
            this.properties,
        );
    }

    protected _scale(scaleX: number, scaleY: number): this {
        return this.copy(this.drawables.map(drawable =>
            drawable.scale(scaleX, scaleY)) as IImageDrawable[]);
    }

    protected _colorMask(color: Color): this {
        return this.copy(this.drawables.map(drawable =>
            drawable.colorMask(color)) as IImageDrawable[]);
    }

    protected _offset(offsetX: number, offsetY: number): this {
        return this.copy(this.drawables.map(drawable =>
            drawable.offset(offsetX, offsetY)) as IImageDrawable[]);
    }
}
