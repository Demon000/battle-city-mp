import { Point } from '@/physics/point/Point';
import { Color } from './Color';
import { IDrawable, DrawableProperties } from './IDrawable';

export interface FillOptions {
    sourceOffsetX: number;
    sourceOffsetY: number;
    width: number;
    height: number;
}

export interface ImageDrawableProperties extends DrawableProperties {
    compositionType?: string;
    maskColor?: Color;
    overlays?: IImageDrawable[];
    fillRepeatWidth?: number;
    fillRepeatHeight?: number;
    fillOptions?: FillOptions;
}

export interface IImageDrawable extends IDrawable {
    fill(options: FillOptions): this | undefined;
    colorMask(color: Color): this | undefined;
    getMinPoint(): Point;
    getMaxPoint(): Point;
}
