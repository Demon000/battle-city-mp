import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import BaseImageDrawable from './BaseImageDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { IImageDrawable, ImageDrawableProperties } from './IImageDrawable';

type Source = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
export default class ImageDrawable extends BaseImageDrawable implements IImageDrawable {
    readonly type = DrawableType.IMAGE;
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

        return this.source.complete && this.source.naturalHeight !== 0 &&
            this.source.naturalWidth !== 0;
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
        const properties = this.properties;
        const width = properties.width;
        const height = properties.height;
        let drawable;
        if (width !== undefined && height !== undefined) {
            drawable = this.resize(width, height);
            if (drawable === undefined) {
                return;
            }

            drawable.draw(context, drawX, drawY);
            return;
        }

        drawX += properties.offsetX ?? 0;
        drawY += properties.offsetY ?? 0;

        context.save();
        if (properties.compositionType !== undefined) {
            context.globalCompositeOperation = properties.compositionType;
        }
        context.drawImage(this.source, drawX, drawY);
        context.restore();

        this.applyOverlays(context, drawX, drawY);
    }

    _resize(width: number, height: number): this {
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

    _scale(scaleX: number, scaleY: number = scaleX): this {
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

    _colorMask(color: Color): this {
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
