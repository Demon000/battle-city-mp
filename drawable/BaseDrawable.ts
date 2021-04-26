import { ResourceMeta } from '@/object/IGameObjectProperties';
import IDrawable, { DrawableProperties } from './IDrawable';

export default abstract class BaseDrawable implements IDrawable {
    abstract type: string;
    abstract meta: ResourceMeta;

    private scaleCache = new Map<string, this>();
    private offsetCache = new Map<string, this>();

    protected inheritedProperties: DrawableProperties = {};
    protected ownProperties: DrawableProperties = {};
    protected _properties?: DrawableProperties;

    protected abstract _scale(scaleX: number, scaleY: number): this;
    protected abstract _offset(offsetX: number, offsetY: number): this;

    abstract draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void;
    abstract isLoaded(): boolean;

    getRenderPass(): number {
        return this.ownProperties.renderPass ?? 0;
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

        const drawble = this._scale(scaleX, scaleY);
        this.scaleCache.set(key, drawble);
        return drawble;
    }

    getOffsetKey(offsetX: number, offsetY: number): string {
        return `${offsetX},${offsetY}`;
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
