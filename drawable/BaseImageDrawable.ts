import BaseDrawable from './BaseDrawable';
import { Color } from './Color';
import { IImageDrawable } from './IImageDrawable';
import ManyKeysMap from 'many-keys-map';

export default abstract class BaseImageDrawable extends BaseDrawable implements IImageDrawable {
    private colorMaskCache = new ManyKeysMap<Color, this>();

    protected abstract _colorMask(color: Color): this;

    colorMask(color: Color): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const cached = this.colorMaskCache.get([color[0], color[1], color[2]]);
        if (cached !== undefined) {
            return cached;
        }

        const drawable = this._colorMask(color);
        this.colorMaskCache.set(color, drawable);
        return drawable;
    }
}
