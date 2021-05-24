import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import BaseImageDrawable from './BaseImageDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { IImageDrawable, ImageDrawableProperties } from './IImageDrawable';
import ImageUtils, { Source } from '../utils/ImageUtils';
import Point from '@/physics/point/Point';
import CanvasUtils, { Context2D } from '@/utils/CanvasUtils';

export default class ImageDrawable extends BaseImageDrawable implements IImageDrawable {
    readonly type = DrawableType.IMAGE;
    private baseCachedSource?: Source;
    private cachedSource?: Source;
    private _isLoaded;
    private source;

    meta;

    constructor(
        source: Source | string,
        meta: ResourceMeta = {},
        properties: ImageDrawableProperties = {},
    ) {
        super();

        if (typeof source === 'string') {
            this._isLoaded = false;
            this.source = new Image();
            this.source.crossOrigin = 'anonymous';
            this.source.addEventListener('load', () => {
                this._isLoaded = true;
            });
            this.source.src = `${CLIENT_SPRITES_RELATIVE_URL}/${source}`;
        } else {
            this._isLoaded = true;
            this.source = source;
        }

        this.meta = meta;
        this.ownProperties = properties;
    }

    get properties(): ImageDrawableProperties {
        return super.properties;
    }

    getMinPoint(): Point {
        const baseMinPoint = this.getOffset();
        const minPoint = {
            x: baseMinPoint.x,
            y: baseMinPoint.y,
        };

        if (this.properties.overlays !== undefined) {
            for (const overlay of this.properties.overlays) {
                const overlayMinPoint = overlay.getMinPoint();
                minPoint.x = Math.min(minPoint.x, baseMinPoint.x + overlayMinPoint.x);
                minPoint.y = Math.min(minPoint.y, baseMinPoint.y + overlayMinPoint.y);
            }
        }

        return minPoint;
    }

    getMaxPoint(): Point {
        const offset = this.getOffset();
        const source = this.getBaseCachedSource();
        const maxPoint = {
            x: offset.x + source.width,
            y: offset.y + source.height,
        };

        if (this.properties.overlays !== undefined) {
            for (const overlay of this.properties.overlays) {
                const overlayMaxPoint = overlay.getMaxPoint();
                maxPoint.x = Math.max(maxPoint.x, offset.x + overlayMaxPoint.x);
                maxPoint.y = Math.max(maxPoint.y, offset.x + overlayMaxPoint.y);
            }
        }

        return maxPoint;
    }

    private getTotalSize(): Point {
        const minPoint = this.getMinPoint();
        const maxPoint = this.getMaxPoint();
        return {
            x: maxPoint.x - minPoint.x,
            y: maxPoint.y - minPoint.y,
        };
    }

    isLoaded(): boolean {
        return this._isLoaded;
    }

    private applyOverlays(context: Context2D, drawX: number, drawY: number): void {
        if (this.properties.overlays === undefined) {
            return;
        }

        for (const overlay of this.properties.overlays) {
            overlay.draw(context, drawX, drawY);
        }
    }

    getBaseCachedSource(): Source {
        if (this.baseCachedSource !== undefined) {
            return this.baseCachedSource;
        }

        const properties = this.properties;
        const scale = this.getScale();

        let canvas = this.source;
        if (scale.x !== 1 || scale.y !== 1) {
            canvas = ImageUtils.drawSourceWithScale(canvas, scale.x, scale.y);
        }

        if (properties.maskColor !== undefined) {
            canvas = ImageUtils.maskColor(canvas, properties.maskColor);
        }

        return this.baseCachedSource = canvas;
    }

    getCachedSource(): Source {
        if (this.cachedSource !== undefined) {
            return this.cachedSource;
        }

        const totalSize = this.getTotalSize();
        const canvas = CanvasUtils.create(totalSize.x, totalSize.y, true);
        const context = CanvasUtils.getContext(canvas);

        const minPoint = this.getMinPoint();
        const offset = this.getOffset();
        const drawX = offset.x - minPoint.x;
        const drawY = offset.y - minPoint.y;

        const source = this.getBaseCachedSource();
        context.drawImage(source, drawX, drawY);
        this.applyOverlays(context, drawX, drawY);

        return this.cachedSource = canvas;
    }

    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void {
        if (!this.isLoaded()) {
            return;
        }

        const source = this.getCachedSource();
        const minPoint = this.getMinPoint();

        drawX += minPoint.x;
        drawY += minPoint.y;

        const properties = this.properties;
        let oldCompositionType;

        if (properties.compositionType !== undefined) {
            oldCompositionType = context.globalCompositeOperation;
            context.globalCompositeOperation = properties.compositionType;
        }

        context.drawImage(source, drawX, drawY);

        if (properties.compositionType !== undefined && oldCompositionType !== undefined) {
            context.globalCompositeOperation = oldCompositionType;
        }
    }

    _scale(scaleX: number, scaleY: number = scaleX): this {
        const properties = this.properties;
        const scale = this.getScale();
        scale.x *= scaleX;
        scale.y *= scaleY;

        return new (<any>this.constructor)(this.source, this.meta, {
            ...this.properties,
            scaleX: scale.x,
            scaleY: scale.y,
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
        const offset = this.getOffset();
        offsetX += offset.x;
        offsetY += offset.y;
        return new (<any>this.constructor)(this.source, this.meta, {
            ...this.properties,
            offsetX,
            offsetY,
        });
    }
}
