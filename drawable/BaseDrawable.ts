import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Color } from './Color';
import IDrawable, { IDrawableProperties } from './IDrawable';

export interface BaseDrawableProperties extends IDrawableProperties {
    renderPass?: number;
}

export default abstract class BaseDrawable implements IDrawable {
    abstract type: string;
    abstract meta: ResourceMeta;
    abstract properties: BaseDrawableProperties;

    abstract draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    abstract scale(scaleX: number, scaleY?: number): IDrawable;
    abstract resize(width: number, height: number): IDrawable;
    abstract color(color: Color): IDrawable;

    isRenderPass(pass: number): boolean {
        const renderPass = this.properties.renderPass;
        return (renderPass === undefined && pass === 0)
            || (renderPass !== undefined && renderPass === pass);
    }
}
