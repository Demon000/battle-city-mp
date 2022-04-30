import { CLIENT_SPRITES_RELATIVE_URL } from '@/config';
import { BaseImageDrawable } from './BaseImageDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { FillOptions, ImageDrawableProperties } from './IImageDrawable';
import { ImageUtils, Source } from '../utils/ImageUtils';
import { Point } from '@/physics/point/Point';
import { CanvasUtils, Context2D } from '@/utils/CanvasUtils';
import { PointUtils } from '@/physics/point/PointUtils';

export class ImageDrawable extends BaseImageDrawable {
    readonly type = DrawableType.IMAGE;
    private baseCachedSource?: Source;
    private cachedSource?: Source;
    private _isLoaded;
    private source;
    private minPoint: Point | undefined;
    private maxPoint: Point | undefined;
    private totalSize: Point | undefined;

    constructor(
        source: Source | string,
        public properties: ImageDrawableProperties = {},
    ) {
        super(properties);

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
    }

    getMinPoint(): Point {
        if (this.minPoint !== undefined) {
            return this.minPoint;
        }

        const baseMinPoint = this.getOffset();
        const minPoint = PointUtils.clone(baseMinPoint);

        if (this.properties.overlays !== undefined) {
            for (const overlay of this.properties.overlays) {
                const overlayMinPoint = overlay.getMinPoint();
                minPoint.x = Math.min(minPoint.x, baseMinPoint.x + overlayMinPoint.x);
                minPoint.y = Math.min(minPoint.y, baseMinPoint.y + overlayMinPoint.y);
            }
        }

        return this.minPoint = minPoint;
    }

    getMaxPoint(): Point {
        if (this.maxPoint !== undefined) {
            return this.maxPoint;
        }

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

        return this.maxPoint = maxPoint;
    }

    private getTotalSize(): Point {
        if (this.totalSize !== undefined) {
            return this.totalSize;
        }

        const minPoint = this.getMinPoint();
        const maxPoint = this.getMaxPoint();
        return this.totalSize = {
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

    private getBaseCachedSource(): Source {
        if (this.baseCachedSource !== undefined) {
            return this.baseCachedSource;
        }

        const scale = this.getScale();

        let canvas = this.source;
        if (this.properties.fillOptions !== undefined) {
            canvas = ImageUtils.fill(canvas, this.properties.fillOptions);
        }

        if (scale.x !== 1 || scale.y !== 1) {
            canvas = ImageUtils.drawSourceWithScale(canvas, scale.x, scale.y);
        }

        if (this.properties.maskColor !== undefined) {
            canvas = ImageUtils.maskColor(canvas, this.properties.maskColor);
        }

        return this.baseCachedSource = canvas;
    }

    private getCachedSource(): Source {
        if (this.cachedSource !== undefined) {
            return this.cachedSource;
        }

        const totalSize = this.getTotalSize();
        const canvas = CanvasUtils.create(totalSize.x, totalSize.y);
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

        let oldCompositionType;

        if (this.properties.compositionType !== undefined) {
            oldCompositionType = context.globalCompositeOperation;
            context.globalCompositeOperation = this.properties.compositionType;
        }

        context.drawImage(source, drawX, drawY);

        if (this.properties.compositionType !== undefined && oldCompositionType !== undefined) {
            context.globalCompositeOperation = oldCompositionType;
        }
    }

    protected _scale(scaleX: number, scaleY: number = scaleX): this {
        const scale = this.getScale();
        const overlayScaleX = scaleX;
        const overlayScaleY = scaleY;

        scaleX *= scale.x;
        scaleY *= scale.y;

        return new (<any>this.constructor)(this.source, {
            ...this.properties,
            scaleX,
            scaleY,
            overlays: this.properties.overlays
                ?.map(overlay => overlay.scale(overlayScaleX, overlayScaleY)),
        });
    }

    protected _colorMask(maskColor: Color): this {
        return new (<any>this.constructor)(this.source, {
            ...this.properties,
            maskColor,
        });
    }

    protected _fill(fillOptions: FillOptions): this {
        return new (<any>this.constructor)(this.source, {
            ...this.properties,
            fillOptions,
        });
    }

    protected _offset(offsetX: number, offsetY: number): this {
        const offset = this.getOffset();
        offsetX += offset.x;
        offsetY += offset.y;
        return new (<any>this.constructor)(this.source, {
            ...this.properties,
            offsetX,
            offsetY,
        });
    }
}
