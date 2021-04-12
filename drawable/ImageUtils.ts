import { Color } from './Color';

export type Source = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export default class ImageUtils {
    static drawSource(source: Source): OffscreenCanvas {
        return this.drawSourceWithScale(source, 1, 1);
    }

    static drawSourceWithScale(
        source: Source,
        scaleX: number,
        scaleY: number,
    ): OffscreenCanvas {
        const width = source.width * scaleX;
        const height = source.height * scaleY;
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');
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
    ): OffscreenCanvas {
        const canvas = new OffscreenCanvas(source.width, source.height);
        const context = canvas.getContext('2d');
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
