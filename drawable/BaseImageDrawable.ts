import { Point } from '@/physics/point/Point';
import { BaseDrawable } from './BaseDrawable';
import { Color } from './Color';
import { IImageDrawable } from './IImageDrawable';

export abstract class BaseImageDrawable extends BaseDrawable implements IImageDrawable {
    private colorMaskCache = new Map<number, this>();

    protected abstract _colorMask(color: Color): this;
    abstract getMinPoint(): Point;
    abstract getMaxPoint(): Point;

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
}
