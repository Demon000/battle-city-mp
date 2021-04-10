import { ResourceMeta } from '@/object/IGameObjectProperties';
import IBaseDrawable, { BaseDrawableProperties } from './IBaseDrawable';

export default abstract class BaseDrawable implements IBaseDrawable {
    abstract type: string;
    abstract meta: ResourceMeta;
    abstract inheritedProperties: BaseDrawableProperties;
    abstract ownProperties: BaseDrawableProperties;

    abstract setInheritedProperties(properties: BaseDrawableProperties): void;
    abstract draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    abstract scale(scaleX: number, scaleY?: number): this;
    abstract resize(width: number, height: number): this;

    isRenderPass(pass: number): boolean {
        const renderPass = this.ownProperties.renderPass;
        return (renderPass === undefined && pass === 0)
            || (renderPass !== undefined && renderPass === pass);
    }
}
