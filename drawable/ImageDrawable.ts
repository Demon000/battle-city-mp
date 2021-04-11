import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Memoize } from '@/utils/memoize-decorator';
import BaseDrawable from './BaseDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { IImageDrawable, ImageDrawableProperties } from './IImageDrawable';

type Source = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
export default class ImageDrawable extends BaseDrawable implements IImageDrawable {
    readonly type = DrawableType.IMAGE;
    inheritedProperties: ImageDrawableProperties = {};
    ownProperties: ImageDrawableProperties;
    _properties?: ImageDrawableProperties;
    meta;

    source;

    constructor(
        source: Source | string,
        meta: ResourceMeta = {},
        properties: ImageDrawableProperties = {},
    ) {
        super();

        if (typeof source === 'string') {
            this.source = new Image();
            this.source.src = `${CLIENT_SPRITES_RELATIVE_URL}/${source}`;
        } else {
            this.source = source;
        }

        this.meta = meta;
        this.ownProperties = properties;
    }

    setInheritedProperties(properties: ImageDrawableProperties = {}): void {
        this.inheritedProperties = properties;
        this._properties = undefined;
    }

    get properties(): ImageDrawableProperties {
        if (this._properties !== undefined) {
            return this._properties;
        }

        return Object.assign({}, this.inheritedProperties, this.ownProperties);
    }

    checkSourceComplete(): void {
        if (this.source instanceof HTMLImageElement
            && (!this.source.complete
                || this.source.naturalHeight === 0
                || this.source.naturalWidth === 0)) {
            throw new Error('Source incomplete');
        }
    }

    applyOverlays(context: CanvasRenderingContext2D, drawX: number, drawY: number): void {
        if (this.properties.overlays === undefined) {
            return;
        }

        for (const overlay of this.properties.overlays) {
            overlay.draw(context, drawX, drawY);
        }
    }

    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void {
        this.checkSourceComplete();

        let drawable;
        if (this.properties.width !== undefined && this.properties.height !== undefined) {
            drawable = this.resize(this.properties.width, this.properties.height);
            drawable.draw(context, drawX, drawY);
            return;
        }

        drawX += this.properties.offsetX ?? 0;
        drawY += this.properties.offsetY ?? 0;



        context.save();
        if (this.properties.compositionType !== undefined) {
            context.globalCompositeOperation = this.properties.compositionType;
        }
        context.drawImage(this.source, drawX, drawY);
        context.restore();

        this.applyOverlays(context, drawX, drawY);
    }

    @Memoize(true)
    resize(width: number, height: number): this {
        this.checkSourceComplete();

        const offscreenCanvas = new OffscreenCanvas(width, height);
        const context = offscreenCanvas.getContext('2d');
        if (context === null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        context.imageSmoothingEnabled = false;
        context.drawImage(this.source, 0, 0, width, height);
        return new (<any>this.constructor)(offscreenCanvas, this.meta, {
            ...this.properties,
            width: undefined,
            height: undefined,
            overlays: this.properties.overlays?.map(overlay => overlay.resize(width, height)),
        });
    }

    @Memoize(true)
    scale(scaleX: number, scaleY: number = scaleX): this {
        this.checkSourceComplete();

        const newWidth = this.source.width * scaleX;
        const newHeight = this.source.height * scaleY;

        const offscreenCanvas = new OffscreenCanvas(newWidth, newHeight);
        const context = offscreenCanvas.getContext('2d');
        if (context === null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        context.imageSmoothingEnabled = false;
        context.drawImage(this.source, 0, 0, newWidth, newHeight);
        const drawable = new (<any>this.constructor)(offscreenCanvas, this.meta, {
            ...this.properties,
            width: this.properties.width === undefined ? undefined : this.properties.width * scaleX,
            height: this.properties.height === undefined ? undefined : this.properties.height * scaleY,
            offsetX: this.properties.offsetX === undefined ? undefined : this.properties.offsetX * scaleX,
            offsetY: this.properties.offsetY === undefined ? undefined : this.properties.offsetY * scaleY,
            overlays: this.properties.overlays?.map(overlay => overlay.scale(scaleX, scaleY)),
        });
        return drawable;
    }

    @Memoize(true)
    colorMask(color: Color): this {
        this.checkSourceComplete();

        const offscreenCanvas = new OffscreenCanvas(this.source.width, this.source.height);
        const context = offscreenCanvas.getContext('2d');
        if (context === null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        context.save();
        context.drawImage(this.source, 0, 0);
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.fillRect(0, 0, this.source.width, this.source.height);
        context.restore();

        return new (<any>this.constructor)(offscreenCanvas, this.meta, {
            ...this.properties,
        });
    }
}
