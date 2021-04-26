import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Context2D } from '@/utils/CanvasUtils';

export interface DrawableProperties {
    renderPass?: number;
    offsetX?: number;
    offsetY?: number;
    scaleX?: number;
    scaleY?: number;
}

export default interface IDrawable {
    readonly type: string;
    readonly meta: ResourceMeta;

    setInheritedProperties(properties: DrawableProperties): void;
    getRenderPass(): number;
    isLoaded(): boolean;

    draw(context: Context2D, drawX: number, drawY: number): void;
    scale(scaleX: number, scaleY?: number): this | undefined;
    offset(offsetX: number, offsetY: number): this | undefined;
}
