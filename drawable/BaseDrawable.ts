import { Point } from '@/physics/point/Point';
import { IDrawable, DrawableProperties } from './IDrawable';

export abstract class BaseDrawable implements IDrawable {
    abstract type: string;

    private scaleCache = new Map<number, this>();
    private offsetCache = new Map<number, this>();
    private scaleVal: Point;
    private offsetVal: Point;
    private renderPass: number;

    protected abstract _scale(scaleX: number, scaleY: number): this;
    protected abstract _offset(offsetX: number, offsetY: number): this;

    abstract load(): Promise<void>;
    abstract getChildDrawables(): Iterable<IDrawable>;
    abstract draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    abstract isLoaded(): boolean;

    constructor(public properties: DrawableProperties) {
        this.scaleVal = {
            x: properties.scaleX ?? 1,
            y: properties.scaleY ?? 1,
        };

        this.offsetVal = {
            x: (properties.offsetX ?? 0) * this.scaleVal.x,
            y: (properties.offsetY ?? 0) * this.scaleVal.y,
        };

        this.renderPass = properties.renderPass ?? 0;
    }

    getRenderPass(): number {
        return this.renderPass;
    }

    getScale(): Point {
        return this.scaleVal;
    }

    getOffset(): Point {
        return this.offsetVal;
    }

    getScaleKey(scaleX: number, scaleY: number): number {
        return scaleX | (scaleY << 16);
    }

    scale(scaleX: number, scaleY: number = scaleX): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const key = this.getScaleKey(scaleX, scaleY);
        const cached = this.scaleCache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const drawble = this._scale(scaleX, scaleY);
        this.scaleCache.set(key, drawble);
        return drawble;
    }

    getOffsetKey(offsetX: number, offsetY: number): number {
        return offsetX | (offsetY << 16);
    }

    offset(offsetX: number, offsetY: number): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const key = this.getOffsetKey(offsetX, offsetY);
        const cached = this.offsetCache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const drawble = this._offset(offsetX, offsetY);
        this.offsetCache.set(key, drawble);
        return drawble;
    }
}
