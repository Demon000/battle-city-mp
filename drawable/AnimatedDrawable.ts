import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Memoize } from '@/utils/memoize-decorator';
import { Color } from './Color';
import Drawable from './Drawable';
import { DrawableType } from './DrawableType';
import IDrawable, { DrawableProperties } from './IDrawable';

export default class AnimatedDrawable implements IDrawable {
    readonly type = DrawableType.ANIMATED;

    drawables;
    durations;
    currentDrawable?: Drawable;
    totalDuration;
    loop;
    meta;

    constructor(
        drawables: Drawable[],
        durations: number[],
        meta: ResourceMeta = {},
        loop = true,
        properties: DrawableProperties = {},
    ) {
        if (drawables.length !== durations.length) {
            throw new Error('Timings do not match animated drawables');
        }

        this.drawables = drawables;
        this.durations = durations;
        this.loop = loop;
        this.totalDuration = durations.reduce((sum, timing) => sum + timing, 0);
        this.meta = meta;

        for (const drawable of drawables) {
            drawable.setDefaultProperties(properties);
        }
    }

    private findCurrentDrawable(referenceTime: number): Drawable | undefined {
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

    private copy(drawables: Drawable[]) {
        return new AnimatedDrawable(
            drawables,
            this.durations,
            this.meta,
            this.loop,
        );
    }

    @Memoize(true)
    resize(width: number, height: number): AnimatedDrawable {
        return this.copy(this.drawables.map(drawable =>
            drawable.resize(width, height)));
    }

    @Memoize(true)
    scale(scaleX: number, scaleY: number = scaleX): AnimatedDrawable {
        return this.copy(this.drawables.map(drawable =>
            drawable.scale(scaleX, scaleY)));
    }

    @Memoize(true)
    color(color: Color): AnimatedDrawable {
        return this.copy(this.drawables.map(drawable =>
            drawable.color(color)));
    }
}
