import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Memoize } from '@/utils/memoize-decorator';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { IImageDrawable, ImageDrawableProperties } from './IImageDrawable';

export default class AnimatedImageDrawable implements IImageDrawable {
    readonly type = DrawableType.ANIMATED_IMAGE;
    inheritedProperties: ImageDrawableProperties = {};
    ownProperties: ImageDrawableProperties;
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

    @Memoize(true)
    resize(width: number, height: number): this {
        return this.copy(this.drawables.map(drawable =>
            drawable.resize(width, height)));
    }

    @Memoize(true)
    scale(scaleX: number, scaleY: number = scaleX): this {
        return this.copy(this.drawables.map(drawable =>
            drawable.scale(scaleX, scaleY)));
    }

    @Memoize(true)
    colorMask(color: Color): this {
        return this.copy(this.drawables.map(drawable =>
            drawable.colorMask(color)));
    }
}
