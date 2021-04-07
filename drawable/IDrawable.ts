import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Color } from './Color';

export interface DrawableProperties {
    offsetX?: number;
    offsetY?: number;
    width?: number;
    height?: number;
    renderPass?: number;
    compositionType?: string;
    overlays?: IDrawable[];
}

export default interface IDrawable {
    readonly type: string;
    readonly meta?: ResourceMeta;

    isRenderPass(pass: number): boolean;
    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    scale(scaleX: number, scaleY?: number): IDrawable;
    resize(width: number, height: number): IDrawable;
    color(color: Color): IDrawable;
}
