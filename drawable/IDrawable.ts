import { ResourceMeta } from '@/object/IGameObjectProperties';

export interface DrawableProperties {
    renderPass?: number;
}

export default interface IDrawable {
    readonly type: string;
    readonly meta: ResourceMeta;

    setInheritedProperties(properties: DrawableProperties): void;
    isRenderPass(pass: number): boolean;
    isLoaded(): boolean;

    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    scale(scaleX: number, scaleY?: number): this | undefined;
    resize(width: number, height: number): this | undefined;
}
