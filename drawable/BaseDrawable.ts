import { ResourceMeta } from '@/object/IGameObjectProperties';
import IDrawable, { DrawableProperties } from './IDrawable';
import ManyKeysMap from 'many-keys-map';

export default abstract class BaseDrawable implements IDrawable {
    abstract type: string;
    abstract meta: ResourceMeta;

    private resizeCache = new ManyKeysMap<[number, number], this>();
    private scaleCache = new ManyKeysMap<[number, number], this>();

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

    resize(width: number, height: number): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const cached = this.resizeCache.get([width, height]);
        if (cached !== undefined) {
            return cached;
        }

        const drawable = this._resize(width, height);
        this.resizeCache.set([width, height], drawable);
        return drawable;
    }

    scale(scaleX: number, scaleY: number = scaleX): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const cached = this.scaleCache.get([scaleX, scaleY]);
        if (cached !== undefined) {
            return cached;
        }

        const drawble = this._scale(scaleX, scaleY);
        this.scaleCache.set([scaleX, scaleY], drawble);
        return drawble;
    }
}
