import IDrawable, { DrawableProperties } from './IDrawable';

export interface BaseDrawableProperties extends DrawableProperties {
    renderPass?: number;
}

export default interface IBaseDrawable extends IDrawable {
    setInheritedProperties(properties: BaseDrawableProperties): void;
    isRenderPass(pass: number): boolean;
}
