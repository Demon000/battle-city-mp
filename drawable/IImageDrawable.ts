import { Point } from '@/physics/point/Point';
import { Color } from './Color';
import { IDrawable, DrawableProperties } from './IDrawable';

export interface ImageDrawableProperties extends DrawableProperties {
    compositionType?: string;
    maskColor?: Color;
    overlays?: IImageDrawable[];
}

export interface IImageDrawable extends IDrawable {
    colorMask(color: Color): this | undefined;
    getMinPoint(): Point;
    getMaxPoint(): Point;
}
