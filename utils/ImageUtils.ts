import { Color } from '../drawable/Color';
import CanvasUtils, { Canvas } from './CanvasUtils';

export type Source = HTMLImageElement | Canvas;

export interface ContentMeasurements {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}

export default class ImageUtils {
    static measureContents(canvas: Canvas): ContentMeasurements {
        const context = canvas.getContext('2d');
        if (context === null) {
            throw new Error('Failed to create offscreen canvas context');
        }

        let minX = undefined;
        let minY = undefined;
        let maxX = undefined;
        let maxY = undefined;

        const contents = context.getImageData(0, 0, canvas.width, canvas.height);
        const rowWidth = contents.width * 4;
        for (let i = 0; i < contents.height * contents.width; i += 4) {
            const y = Math.floor(i / rowWidth);
            const x = (i % rowWidth) / 4;

            if (contents.data[i + 3] !== 0) {
                if (minX === undefined || x < minX) {
                    minX = x;
                }

                if (maxX === undefined || x > maxX) {
                    maxX = x;
                }

                if (minY === undefined || y < minY) {
                    minY = y;
                }

                if (maxY === undefined || y > maxY) {
                    maxY = y;
                }
            }
        }

        return {
            height: (maxY === undefined || minY === undefined) ? 0 : maxY - minY + 1,
            width: (maxX === undefined || minX === undefined) ? 0 : maxX - minX + 1,
            minX: minX ?? 0,
            maxX: maxX ?? 0,
            minY: minY ?? 0,
            maxY: maxY ?? 0,
        };
    }

    static drawSourceWithScale(
        source: Source,
        scaleX: number,
        scaleY: number,
    ): Canvas {
        const width = source.width * scaleX;
        const height = source.height * scaleY;
        const canvas = CanvasUtils.create(width, height);
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
    ): Canvas {
        const canvas = CanvasUtils.create(source.width, source.height);
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
