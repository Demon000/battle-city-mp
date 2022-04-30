import { Entity } from '@/ecs/Entity';
import { Point } from '@/physics/point/Point';
import { Context2D } from '@/utils/CanvasUtils';

export type DrawableTestFunction = (entity: Entity) => boolean;
export type DrawableProcessingFunction = (this: IDrawable, entity: Entity) => IDrawable | undefined;

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

    properties: DrawableProperties;

    getRenderPass(): number;
    isLoaded(): boolean;

    getScale(): Point;
    getOffset(): Point;

    draw(context: Context2D, drawX: number, drawY: number): void;
    scale(scaleX: number, scaleY?: number): this | undefined;
    offset(offsetX: number, offsetY: number): this | undefined;
}
