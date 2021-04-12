import { Color } from './Color';

export type Source = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export default class ImageUtils {
    static drawSource(source: Source, context?: OffscreenCanvasRenderingContext2D | null): OffscreenCanvas {
        return this.drawSourceWithSize(source, source.width, source.height, context);
    }

    static drawSourceWithSize(
        source: Source,
        width: number,
        height: number,
        context?: OffscreenCanvasRenderingContext2D | null,
    ): OffscreenCanvas {
        if (context === undefined) {
            const canvas = new OffscreenCanvas(width, height);
            context = canvas.getContext('2d');
        }

        if (context === null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        context.imageSmoothingEnabled = false;
        context.drawImage(source, 0, 0, width, height);
        return context.canvas;
    }

    static maskColor(
        source: Source,
        color: Color,
        context?: OffscreenCanvasRenderingContext2D | null,
    ): OffscreenCanvas {
        if (context === undefined) {
            const canvas = new OffscreenCanvas(source.width, source.height);
            context = canvas.getContext('2d');
        }

        if (context === null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        context.drawImage(source, 0, 0);
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.fillRect(0, 0, source.width, source.height);
        return context.canvas;
    }
}
