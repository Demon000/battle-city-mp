import { Point } from '@/physics/point/Point';
import { BaseDrawable } from './BaseDrawable';
import { Color } from './Color';
import { FillOptions, IImageDrawable, ImageDrawableProperties } from './IImageDrawable';

export abstract class BaseImageDrawable extends BaseDrawable implements IImageDrawable {
    private colorMaskCache = new Map<number, this>();
    private fillCache = new Map<string, this>();

    protected abstract _colorMask(color: Color): this;
    protected abstract _fill(options: FillOptions): this;

    abstract getMinPoint(): Point;
    abstract getMaxPoint(): Point;

    constructor(public properties: ImageDrawableProperties) {
        super(properties);
    }

    getColorMaskKey(color: Color): number {
        return color[0] | (color[1] << 8) | (color[2] << 16);
    }

    colorMask(color: Color): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const key = this.getColorMaskKey(color);
        const cached = this.colorMaskCache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const drawable = this._colorMask(color);
        this.colorMaskCache.set(key, drawable);
        return drawable;
    }

    getFillKey(options: FillOptions): string {
        return `${options.sourceOffsetX},${options.sourceOffsetY},` +
                `${options.width},${options.height}`;
    }

    fill(options: FillOptions): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const key = this.getFillKey(options);
        const cached = this.fillCache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const drawable = this._fill(options);
        this.fillCache.set(key, drawable);
        return drawable;
    }
}
