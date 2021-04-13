import { ResourceMeta } from '@/object/IGameObjectProperties';
import BaseImageDrawable from './BaseImageDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { IImageDrawable, ImageDrawableProperties } from './IImageDrawable';

export default class AnimatedImageDrawable extends BaseImageDrawable {
    readonly type = DrawableType.ANIMATED_IMAGE;
    meta;

    drawables;
    durations;
    currentDrawable?: IImageDrawable;
    totalDuration;
    loop;

    constructor(
        drawables: IImageDrawable[],
        durations: number[],
        meta: ResourceMeta = {},
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
        this.meta = meta;
        this.ownProperties = properties;
        this.updateDrawablesInheritedProperties();
    }

    private findCurrentDrawable(referenceTime: number): IImageDrawable | undefined {
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

    updateCurrentDrawable(referenceTime: number): void {
        this.currentDrawable = this.findCurrentDrawable(referenceTime);
    }

    isRenderPass(pass: number): boolean {
        if (this.currentDrawable === undefined) {
            return true;
        }

        return this.currentDrawable.isRenderPass(pass);
    }       

    isLoaded(): boolean {
        return this.drawables.every(drawable => drawable.isLoaded());
    }

    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void {
        if (this.currentDrawable !== undefined) {
            this.currentDrawable.draw(context, drawX, drawY);
        }
    }

    private copy(drawables: IImageDrawable[]): this {
        return new (<any>this.constructor)(
            drawables,
            this.durations,
            this.meta,
            this.loop,
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

    _offset(offsetX: number, offsetY: number): this {
        return this.copy(this.drawables.map(drawable =>
            drawable.offset(offsetX, offsetY)) as IImageDrawable[]);
    }
}
