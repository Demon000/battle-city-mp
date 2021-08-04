import { GameObject } from '@/object/GameObject';
import { Point } from '@/physics/point/Point';
import { Context2D } from '@/utils/CanvasUtils';

export type DrawableTestFunction = (object: GameObject) => boolean;
export type DrawableProcessingFunction = (this: IDrawable, object: GameObject) => IDrawable | undefined;

export interface DrawableProperties {
    tests?: DrawableTestFunction[];
    processor?: DrawableProcessingFunction;
    renderPass?: number;
    offsetX?: number;
    offsetY?: number;
    scaleX?: number;
    scaleY?: number;
}

export interface IDrawable {
    readonly type: string;

    setInheritedProperties(properties: DrawableProperties): void;
    getRenderPass(): number;
    isLoaded(): boolean;

    properties: DrawableProperties;
    getScale(): Point;
    getOffset(): Point;

    draw(context: Context2D, drawX: number, drawY: number): void;
    scale(scaleX: number, scaleY?: number): this | undefined;
    offset(offsetX: number, offsetY: number): this | undefined;
}
