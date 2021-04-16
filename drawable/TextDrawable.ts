import { ResourceMeta } from '@/object/IGameObjectProperties';
import BaseDrawable from './BaseDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { DrawableProperties } from './IDrawable';
import ImageUtils, { Source } from '../utils/ImageUtils';
import { CLIENT_FONTS_RELATIVE_URL } from '@/config';
import CanvasUtils, { Canvas } from '@/utils/CanvasUtils';

export interface FontFaceProperties {
    family: string;
    url: string;
}

export type TextPositionReference = 'center' | 'end' | 'default';
export interface TextDrawableProperties extends DrawableProperties {
    fontUrl?: string;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: Color;
    maxTextWidth?: number;
    backgroundColor?: Color;
    backgroundAlpha?: number;
    paddingX?: number;
    paddingY?: number;
    positionXReference?: TextPositionReference,
    positionYReference?: TextPositionReference,
}

export default class TextDrawable extends BaseDrawable {
    readonly type = DrawableType.TEXT;
    private textCache = new Map<string, this>();
    private positionXReferenceCache = new Map<string, this>();
    private positionYReferenceCache = new Map<string, this>();
    protected ownProperties: TextDrawableProperties;
    private cachedSource?: Source;
    private fontFace?: FontFace;
    private _isLoaded = false;
    text;
    meta;

    constructor(
        text: string,
        meta: ResourceMeta = {},
        properties: TextDrawableProperties = {},
    ) {
        super();

        this.text = text;
        this.meta = meta;
        this.ownProperties = properties;

        if (properties.fontFamily !== undefined && properties.fontUrl !== undefined) {
            this.fontFace = new FontFace(properties.fontFamily,
                `url('${CLIENT_FONTS_RELATIVE_URL}/${properties.fontUrl}')`);
            this.fontFace.load()
                .then((fontFace: FontFace) => {
                    document.fonts.add(fontFace);
                    this._isLoaded = true;
                }).catch(_err => {
                    this.ownProperties.fontFamily = 'Arial';
                    this._isLoaded = true;
                });
        }
    }

    get properties(): TextDrawableProperties {
        return super.properties;
    }

    isLoaded(): boolean {
        return this._isLoaded;
    }

    private getContextFont(): string {
        const properties = this.properties;
        return `${properties.fontSize}px '${properties.fontFamily}'`;
    }

    private getContextFontFillStyle(): string {
        const properties = this.properties;
        const color = properties.fontColor ?? [255, 255, 255];
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    }

    private getContextBackgroundFillStyle(): string {
        const properties = this.properties;
        const bgColor = properties.backgroundColor ?? [0, 0, 0];
        const bgAlpha = properties.backgroundAlpha ?? 1;
        return `rgba(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]}, ${bgAlpha})`;
    }

    private drawText(): Canvas {
        const properties = this.properties;
        const scaleX = properties.scaleX ?? 1;
        const scaleY = properties.scaleY ?? 1;
        const fontSize = (properties.fontSize ?? 16) * scaleY;
        const width = (fontSize * (this.text.length + 2)) * scaleX;
        const height = (fontSize * 4) * scaleY;
        const offsetX = fontSize * scaleX;
        const offsetY = fontSize * scaleY;

        const canvas = CanvasUtils.create(width, height);
        const context = canvas.getContext('2d');
        if (context == null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        context.font = this.getContextFont();
        context.fillStyle = this.getContextFontFillStyle();
        context.fillText(this.text, offsetX, offsetY);
        return canvas;
    }

    private getCachedSource(): Source {
        if (this.cachedSource !== undefined) {
            return this.cachedSource;
        }

        const textCanvas = this.drawText();
        const textMeasurements = ImageUtils.measureContents(textCanvas);
        const properties = this.properties;
        const scaleX = properties.scaleX ?? 1;
        const scaleY = properties.scaleY ?? 1;
        const paddingX = (properties.paddingX ?? 0) * scaleX;
        const paddingY = (properties.paddingY ?? 0) * scaleY;
        const maxTextWidth = properties.maxTextWidth && properties.maxTextWidth * scaleX;
        let textWidth = textMeasurements.width;
        if (maxTextWidth !== undefined
            && textWidth > maxTextWidth) {
            textWidth = maxTextWidth ;
        }
        const width = paddingX * 2 + textMeasurements.width;
        const height = paddingY * 2 + textMeasurements.height;

        const canvas = CanvasUtils.create(width, height);
        const context = canvas.getContext('2d');
        if (context == null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        if (properties.backgroundColor !== undefined) {
            context.fillStyle = this.getContextBackgroundFillStyle();
            context.fillRect(0, 0, width, height);
        }

        context.drawImage(textCanvas,
            textMeasurements.minX, textMeasurements.minY,
            textWidth, textMeasurements.height,
            paddingX, paddingY,
            textWidth, textMeasurements.height);

        return this.cachedSource = canvas;
    }

    draw(context: CanvasRenderingContext2D, drawX: number, drawY: number): void {
        if (!this.isLoaded()) {
            return;
        }

        const source = this.getCachedSource();
        const properties = this.properties;

        const scaleX = properties.scaleX ?? 1;
        const scaleY = properties.scaleY ?? 1;
        drawX += (properties.offsetX ?? 0) * scaleX;
        drawY += (properties.offsetY ?? 0) * scaleY;

        if (properties.positionXReference === 'center') {
            drawX -= Math.floor(source.width / 2);
        } else if (properties.positionXReference === 'end') {
            drawX -= source.width;
        }

        if (properties.positionYReference === 'center') {
            drawY -= Math.floor(source.height / 2);
        } else if (properties.positionYReference === 'end') {
            drawY -= source.height;
        }

        context.drawImage(source, drawX, drawY);
    }

    _withText(text: string): this {
        return new (<any>this.constructor)(text, this.meta, {
            ...this.properties,
        });
    }

    withText(text: string): this | undefined {
        if (!this.isLoaded()) {
            return undefined;
        }

        const cached = this.textCache.get(text);
        if (cached !== undefined) {
            return cached;
        }

        const drawable = this._withText(text);
        this.textCache.set(text, drawable);
        return drawable;
    }

    _scale(scaleX: number, scaleY = scaleX): this {
        const properties = this.properties;
        scaleX *= properties.scaleX ?? 1;
        scaleY *= properties.scaleY ?? 1;
        return new (<any>this.constructor)(this.text, this.meta, {
            ...this.properties,
            scaleX,
            scaleY,
        });
    }

    _offset(offsetX: number, offsetY: number): this {
        const properties = this.properties;
        offsetX += properties.offsetX ?? 0;
        offsetY += properties.offsetY ?? 0;
        return new (<any>this.constructor)(this.text, this.meta, {
            ...this.properties,
            offsetX,
            offsetY,
        });
    }

    _positionXReference(positionXReference: TextPositionReference): this {
        return new (<any>this.constructor)(this.text, this.meta, {
            ...this.properties,
            positionXReference,
        });
    }

    positionXReference(positionXReference: TextPositionReference): this | undefined {
        if (!this.isLoaded) {
            return undefined;
        }

        const cached = this.positionXReferenceCache.get(positionXReference);
        if (cached !== undefined) {
            return cached;
        }

        const drawable = this._positionXReference(positionXReference);
        this.positionXReferenceCache.set(positionXReference, drawable);
        return drawable;
    }

    _positionYReference(positionYReference: TextPositionReference): this {
        return new (<any>this.constructor)(this.text, this.meta, {
            ...this.properties,
            positionYReference,
        });
    }

    positionYReference(positionYReference: TextPositionReference): this | undefined {
        if (!this.isLoaded) {
            return undefined;
        }

        const cached = this.positionYReferenceCache.get(positionYReference);
        if (cached !== undefined) {
            return cached;
        }

        const drawable = this._positionYReference(positionYReference);
        this.positionYReferenceCache.set(positionYReference, drawable);
        return drawable;
    }
}