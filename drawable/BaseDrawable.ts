import { ResourceMeta } from '@/object/IGameObjectProperties';
import IDrawable, { DrawableProperties } from './IDrawable';

export default abstract class BaseDrawable implements IDrawable {
    abstract type: string;
    abstract meta: ResourceMeta;

    private resizeCache = new Map<string, this>();
    private scaleCache = new Map<string, this>();

    protected inheritedProperties: DrawableProperties = {};
    protected ownProperties: DrawableProperties = {};
    protected _properties?: DrawableProperties;

    protected abstract _resize(width: number, height: number): this;
    protected abstract _scale(scaleX: number, scaleY: number): this;

    abstract draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    abstract isLoaded(): boolean;

    isRenderPass(pass: number): boolean {
        const renderPass = this.ownProperties.renderPass;
        return (renderPass === undefined && pass === 0)
            || (renderPass !== undefined && renderPass === pass);
    }

    setInheritedProperties(properties: DrawableProperties = {}): void {
        this.inheritedProperties = properties;
        this._properties = undefined;
    }

    get properties(): DrawableProperties {
        if (this._properties !== undefined) {
            return this._properties;
        }

        this._properties = Object.assign({}, this.inheritedProperties, this.ownProperties);
        return this._properties;
    }

    getResizeKey(width: number, height: number): string {
        return `${width},${height}`;
    }

    resize(width: number, height: number): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const key = this.getResizeKey(width, height);
        const cached = this.resizeCache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        console.log('miss');
        const drawable = this._resize(width, height);
        this.resizeCache.set(key, drawable);
        return drawable;
    }

    getScaleKey(scaleX: number, scaleY: number): string {
        return `${scaleX},${scaleY}`;
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

        console.log('miss');
        const drawble = this._scale(scaleX, scaleY);
        this.scaleCache.set(key, drawble);
        return drawble;
    }
}
