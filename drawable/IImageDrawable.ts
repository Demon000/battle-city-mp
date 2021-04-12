import { Color } from './Color';
import IDrawable, { DrawableProperties } from './IDrawable';

export interface ImageDrawableProperties extends DrawableProperties {
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
    compositionType?: string;
    maskColor?: Color;
    overlays?: IImageDrawable[];
}

export interface IImageDrawable extends IDrawable {
    colorMask(color: Color): this | undefined;
}
