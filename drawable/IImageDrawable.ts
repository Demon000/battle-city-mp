import { Color } from './Color';
import IDrawable, { DrawableProperties } from './IDrawable';

export interface ImageDrawableProperties extends DrawableProperties {
    scaleX?: number;
    scaleY?: number;
    compositionType?: string;
    maskColor?: Color;
    overlays?: IImageDrawable[];
}

export interface IImageDrawable extends IDrawable {
    colorMask(color: Color): this | undefined;
}
