import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Memoize } from '@/utils/memoize-decorator';
import BaseDrawable from './BaseDrawable';
import { Color } from './Color';
import ImageDrawable from './ImageDrawable';
import { DrawableType } from './DrawableType';
import { DrawableProperties } from './ImageDrawable';

export default class AnimatedImageDrawable extends BaseDrawable {
    readonly type = DrawableType.ANIMATED;
    properties;
    meta;

    drawables;
    durations;
    currentDrawable?: ImageDrawable;
    totalDuration;
    loop;

    constructor(
        drawables: ImageDrawable[],
        durations: number[],
        meta: ResourceMeta = {},
        loop = true,
        properties: DrawableProperties = {},
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
        this.properties = properties;

        for (const drawable of drawables) {
            drawable.setDefaultProperties(properties);
        }
    }

    private findCurrentDrawable(referenceTime: number): ImageDrawable | undefined {
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

    private copy(drawables: ImageDrawable[]) {
        return new AnimatedImageDrawable(
            drawables,
            this.durations,
            this.meta,
            this.loop,
        );
    }

    @Memoize(true)
    resize(width: number, height: number): AnimatedImageDrawable {
        return this.copy(this.drawables.map(drawable =>
            drawable.resize(width, height)));
    }

    @Memoize(true)
    scale(scaleX: number, scaleY: number = scaleX): AnimatedImageDrawable {
        return this.copy(this.drawables.map(drawable =>
            drawable.scale(scaleX, scaleY)));
    }

    @Memoize(true)
    color(color: Color): AnimatedImageDrawable {
        return this.copy(this.drawables.map(drawable =>
            drawable.color(color)));
    }
}
