import Point from '@/physics/point/Point';
import BaseDrawable from './BaseDrawable';
import { Color } from './Color';
import { IImageDrawable } from './IImageDrawable';

export default abstract class BaseImageDrawable extends BaseDrawable implements IImageDrawable {
    private colorMaskCache = new Map<string, this>();

    protected abstract _colorMask(color: Color): this;
    abstract getMinPoint(): Point;
    abstract getMaxPoint(): Point;

    getColorMaskKey(color: Color): string {
        return `${color[0]},${color[1]},${color[2]}`;
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
