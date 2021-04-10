import { ResourceMeta } from '@/object/IGameObjectProperties';

export interface DrawableProperties {}

export default interface IDrawable {
    readonly type: string;
    readonly meta: ResourceMeta;

    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    scale(scaleX: number, scaleY?: number): this;
    resize(width: number, height: number): this;
}
