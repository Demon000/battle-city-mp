import { Color } from './Color';
import IBaseDrawable, { BaseDrawableProperties } from './IBaseDrawable';

export interface ImageDrawableProperties extends BaseDrawableProperties {
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
    compositionType?: string;
    overlays?: IImageDrawable[];
}

export interface IImageDrawable extends IBaseDrawable {
    colorMask(color: Color): this;
}
