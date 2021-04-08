import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Memoize } from 'typescript-memoize';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { DrawableProperties } from './IDrawable';

type Source = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
export default class Drawable {
    readonly type = DrawableType.SIMPLE;
    source;
    properties: DrawableProperties;
    meta;

    constructor(
        source: Source | string,
        meta: ResourceMeta = {},
        properties: DrawableProperties = {},
    ) {
        if (typeof source === 'string') {
            this.source = new Image();
            this.source.src = `${CLIENT_SPRITES_RELATIVE_URL}/${source}`;
        } else {
            this.source = source;
        }

        this.meta = meta;
        this.properties = properties;
    }

    setDefaultProperties(properties: DrawableProperties = {}): void {
        this.properties.offsetX = this.properties.offsetX ?? properties.offsetX;
        this.properties.offsetY = this.properties.offsetY ?? properties.offsetY;
        this.properties.renderPass = this.properties.renderPass ?? properties.renderPass;
        this.properties.compositionType = this.properties.compositionType ?? properties.compositionType;
        this.properties.overlays = this.properties.overlays ?? properties.overlays;
        this.properties.width = this.properties.width ?? properties.width;
        this.properties.height = this.properties.height ?? properties.height;
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

    isRenderPass(pass: number): boolean {
        const renderPass = this.properties.renderPass;
        return (renderPass === undefined && pass === 0)
            || (renderPass !== undefined && renderPass === pass);
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
    resize(width: number, height: number): Drawable {
        this.checkSourceComplete();

        const offscreenCanvas = new OffscreenCanvas(width, height);
        const context = offscreenCanvas.getContext('2d');
        if (context === null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        context.imageSmoothingEnabled = false;
        context.drawImage(this.source, 0, 0, width, height);
        return new Drawable(offscreenCanvas, this.meta, {
            ...this.properties,
            width: undefined,
            height: undefined,
            overlays: this.properties.overlays?.map(overlay => overlay.resize(width, height)),
        });
    }

    @Memoize(true)
    scale(scaleX: number, scaleY: number = scaleX): Drawable {
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
        const drawable = new Drawable(offscreenCanvas, this.meta, {
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
    color(color: Color): Drawable {
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

        return new Drawable(offscreenCanvas, this.meta, {
            ...this.properties,
        });
    }
}
