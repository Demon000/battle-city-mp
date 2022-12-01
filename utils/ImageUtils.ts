import { FillOptions } from '@/drawable/IImageDrawable';
import { Color } from '../drawable/Color';
import { assert } from './assert';
import { CanvasUtils, Canvas } from './CanvasUtils';

export type Source = HTMLImageElement | Canvas;

export interface ContentMeasurements {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}

export class ImageUtils {
    static measureContents(canvas: Canvas): ContentMeasurements {
        const context = CanvasUtils.getContext(canvas);

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
        const context = CanvasUtils.getContext(canvas);

        context.imageSmoothingEnabled = false;
        context.drawImage(source, 0, 0, width, height);
        return context.canvas;
    }

    static maskColor(
        source: Source,
        color: Color,
    ): Canvas {
        const canvas = CanvasUtils.create(source.width, source.height);
        const context = CanvasUtils.getContext(canvas);

        context.drawImage(source, 0, 0);
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        context.fillRect(0, 0, source.width, source.height);
        return context.canvas;
    }

    static fill(
        source: Source,
        options: FillOptions,
    ): Canvas {
        const offsetWidth = options.width + options.sourceOffsetX;
        const offsetHeight = options.height + options.sourceOffsetY;
        const offsetCanvas = CanvasUtils.create(offsetWidth, offsetHeight);
        const offsetContext = CanvasUtils.getContext(offsetCanvas);

        const pattern = offsetContext.createPattern(source as CanvasImageSource, 'repeat');
        assert(pattern !== null, 'Failed to create canvas pattern');
        offsetContext.fillStyle = pattern;

        offsetContext.fillRect(0, 0, offsetWidth, offsetHeight);

        const canvas = CanvasUtils.create(options.width, options.height);
        const context = CanvasUtils.getContext(canvas);

        context.drawImage(offsetCanvas, options.sourceOffsetX,
            options.sourceOffsetY, options.width, options.height, 0, 0,
            options.width, options.height);

        return context.canvas;
    }
}
