import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import BaseImageDrawable from './BaseImageDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { IImageDrawable, ImageDrawableProperties } from './IImageDrawable';
import ImageUtils, { Source } from '../utils/ImageUtils';

export default class ImageDrawable extends BaseImageDrawable implements IImageDrawable {
    readonly type = DrawableType.IMAGE;
    private cachedSource?: Source;
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

    get properties(): ImageDrawableProperties {
        return super.properties;
    }

    isLoaded(): boolean {
        if (!(this.source instanceof HTMLImageElement)) {
            return true;
        }

        const properties = this.properties;
        if (properties.overlays !== undefined
            && !properties.overlays.every(overlay => overlay.isLoaded())) {
            return false;
        }

        return this.source.complete && this.source.naturalHeight !== 0 &&
            this.source.naturalWidth !== 0;
    }

    private applyOverlays(context: CanvasRenderingContext2D, drawX: number, drawY: number): void {
        if (this.properties.overlays === undefined) {
            return;
        }

        for (const overlay of this.properties.overlays) {
            overlay.draw(context, drawX, drawY);
        }
    }

    private getCachedSource(): Source {
        if (this.cachedSource !== undefined) {
            return this.cachedSource;
        }

        const properties = this.properties;
        const scaleX = properties.scaleX ?? 1;
        const scaleY = properties.scaleY ?? 1;
        let canvas = this.source;
        if (scaleX !== 1 && scaleY !== 1) {
            canvas = ImageUtils.drawSourceWithScale(canvas, scaleX, scaleY);
        }

        if (properties.maskColor !== undefined) {
            canvas = ImageUtils.maskColor(canvas, properties.maskColor);
        }

        return this.cachedSource = canvas;
    }

    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void {
        if (!this.isLoaded()) {
            return;
        }

        const source = this.getCachedSource();
        const properties = this.properties;

        drawX += (properties.offsetX ?? 0) * (properties.scaleX ?? 1);
        drawY += (properties.offsetY ?? 0) * (properties.scaleY ?? 1);

        if (properties.compositionType !== undefined) {
            context.save();
            context.globalCompositeOperation = properties.compositionType;
        }
        context.drawImage(source, drawX, drawY);
        if (properties.compositionType !== undefined) {
            context.restore();
        }

        this.applyOverlays(context, drawX, drawY);
    }

    _scale(scaleX: number, scaleY: number = scaleX): this {
        const properties = this.properties;
        const ownScaleX = (properties.scaleX ?? 1) * scaleX;
        const ownScaleY = (properties.scaleY ?? 1) * scaleY;

        return new (<any>this.constructor)(this.source, this.meta, {
            ...this.properties,
            scaleX: ownScaleX,
            scaleY: ownScaleY,
            overlays: properties.overlays?.map(overlay => overlay.scale(scaleX, scaleY)),
        });
    }

    _colorMask(maskColor: Color): this {
        return new (<any>this.constructor)(this.source, this.meta, {
            ...this.properties,
            maskColor,
        });
    }

    _offset(offsetX: number, offsetY: number): this {
        const properties = this.properties;
        offsetX += properties.offsetX ?? 0;
        offsetY += properties.offsetY ?? 0;
        return new (<any>this.constructor)(this.source, this.meta, {
            ...this.properties,
            offsetX,
            offsetY,
        });
    }
}
