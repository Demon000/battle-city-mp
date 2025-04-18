import { BaseDrawable } from './BaseDrawable';
import { Color } from './Color';
import { DrawableType } from './DrawableType';
import { DrawableProperties, IDrawable } from './IDrawable';
import { ImageUtils, Source } from '../utils/ImageUtils';
import { CLIENT_FONTS_RELATIVE_URL } from '@/client/config';
import { CanvasUtils, Canvas } from '@/utils/CanvasUtils';

export interface FontFaceProperties {
    family: string;
    url: string;
}

export type TextPositionReference = 'center' | 'end' | 'default';
export interface TextDrawableProperties extends DrawableProperties {
    fontUrl?: string;
    fontFamily?: string;
    fontFace?: FontFace;
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

export class TextDrawable extends BaseDrawable {
    readonly type = DrawableType.TEXT;
    private textCache = new Map<string, this>();
    private positionXReferenceCache = new Map<string, this>();
    private positionYReferenceCache = new Map<string, this>();
    private cachedSource?: Source;
    private _isLoaded;
    text;

    constructor(
        text: string,
        public properties: TextDrawableProperties,
    ) {
        super(properties);

        this.text = text;

        if (properties.fontFace !== undefined
            || properties.fontUrl === undefined) {
            this._isLoaded = true;
        } else {
            this._isLoaded = false;
        }
    }

    private _load(resolve: () => void, reject: (err: Error) => void): void {
        if (this._isLoaded
            || this.properties.fontUrl === undefined
            || this.properties.fontFamily === undefined
        ) {
            resolve();
            return;
        }

        this.properties.fontFace = new FontFace(this.properties.fontFamily,
            `url('${CLIENT_FONTS_RELATIVE_URL}/${this.properties.fontUrl}')`);
        this.properties.fontFace.load()
            .then((fontFace: FontFace) => {
                document.fonts.add(fontFace);
                this._isLoaded = true;
                resolve();
            }).catch(_err => {
                this.properties.fontFamily = undefined;
                reject(new Error(`Failed to load font ${this.properties.fontUrl}`));
            });
    }

    getChildDrawables(): IDrawable[] {
        return [];
    }

    async load(): Promise<void> {
        return new Promise(this._load.bind(this));
    }

    isLoaded(): boolean {
        return this._isLoaded;
    }

    private getContextBackgroundFillStyle(): string {
        const bgColor = this.properties.backgroundColor ?? [0, 0, 0];
        const bgAlpha = this.properties.backgroundAlpha ?? 1;
        return `rgba(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]}, ${bgAlpha})`;
    }

    private drawText(): Canvas {
        const scale = this.getScale();
        const fontSize = (this.properties.fontSize ?? 16) * scale.y;
        const width = (fontSize * (this.text.length + 2)) * scale.x;
        const height = (fontSize * 4) * scale.y;

        const canvas = CanvasUtils.create(width, height);
        const context = CanvasUtils.getContext(canvas);

        const fontFamily = this.properties.fontFamily ?? 'Arial';
        context.font = `${fontSize}px '${fontFamily}'`;

        const color = this.properties.fontColor ?? [255, 255, 255];
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

        const offsetX = fontSize * scale.x;
        const offsetY = fontSize * scale.y;
        context.fillText(this.text, offsetX, offsetY);

        return canvas;
    }

    private getCachedSource(): Source {
        if (this.cachedSource !== undefined) {
            return this.cachedSource;
        }

        const textCanvas = this.drawText();
        const textMeasurements = ImageUtils.measureContents(textCanvas);
        const scale = this.getScale();
        const paddingX = (this.properties.paddingX ?? 0) * scale.x;
        const paddingY = (this.properties.paddingY ?? 0) * scale.y;
        let maxTextWidth;
        if (this.properties.maxTextWidth !== undefined) {
            maxTextWidth = this.properties.maxTextWidth * scale.x;
        }
        let textWidth = textMeasurements.width;
        if (maxTextWidth !== undefined
            && textWidth > maxTextWidth) {
            textWidth = maxTextWidth ;
        }
        const width = paddingX * 2 + textMeasurements.width;
        const height = paddingY * 2 + textMeasurements.height;

        const canvas = CanvasUtils.create(width, height);
        const context = CanvasUtils.getContext(canvas);

        if (this.properties.backgroundColor !== undefined) {
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
        const offset = this.getOffset();
        drawX += offset.x;
        drawY += offset.y;

        if (this.properties.positionXReference === 'center') {
            drawX -= Math.floor(source.width / 2);
        } else if (this.properties.positionXReference === 'end') {
            drawX -= source.width;
        }

        if (this.properties.positionYReference === 'center') {
            drawY -= Math.floor(source.height / 2);
        } else if (this.properties.positionYReference === 'end') {
            drawY -= source.height;
        }

        context.drawImage(source, drawX, drawY);
    }

    protected _withText(text: string): this {
        return new (<any>this.constructor)(text, this.properties);
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

    protected _scale(scaleX: number, scaleY = scaleX): this {
        const scale = this.getScale();
        scaleX *= scale.x;
        scaleY *= scale.y;
        return new (<any>this.constructor)(this.text, {
            ...this.properties,
            scaleX,
            scaleY,
        });
    }

    protected _offset(offsetX: number, offsetY: number): this {
        const offset = this.getOffset();
        offsetX += offset.x;
        offsetY += offset.y;
        return new (<any>this.constructor)(this.text, {
            ...this.properties,
            offsetX,
            offsetY,
        });
    }

    protected _positionXReference(positionXReference: TextPositionReference): this {
        return new (<any>this.constructor)(this.text, {
            ...this.properties,
            positionXReference,
        });
    }

    positionXReference(positionXReference: TextPositionReference): this | undefined {
        if (!this.isLoaded()) {
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

    protected _positionYReference(positionYReference: TextPositionReference): this {
        return new (<any>this.constructor)(this.text, {
            ...this.properties,
            positionYReference,
        });
    }

    positionYReference(positionYReference: TextPositionReference): this | undefined {
        if (!this.isLoaded()) {
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
