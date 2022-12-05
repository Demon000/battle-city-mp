import { Color } from '@/drawable/Color';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { PNGWithMetadata } from 'pngjs';
import { ColorUtils } from './ColorUtils';

export class PNGUtils {
    static getPixelId(png: PNGWithMetadata, x: number, y: number): number {
        return (png.width * y + x) << 2;
    }

    static getPixelColor(
        png: PNGWithMetadata,
        x: number,
        y: number,
    ): Color | undefined {
        const id = this.getPixelId(png, x, y);
        const r = png.data[id];
        const g = png.data[id + 1];
        const b = png.data[id + 2];
        if (r === 0 && g === 0 && b === 0) {
            return undefined;
        }

        return [r, g, b];
    }

    static setPixelColor(
        png: PNGWithMetadata,
        x: number,
        y: number,
        color: Color,
    ): void {
        const id = this.getPixelId(png, x, y);

        for (let i = 0; i < 3; i++) {
            png.data[id + i] = color[i];
        }
    }

    static findSameColorRectangle(
        png: PNGWithMetadata,
        startColor: Color,
        startX: number,
        startY: number,
    ): BoundingBox {
        let endX = png.width;
        let endY = png.height;

        for (let x = startX; x < endX; x++) {
            const color = this.getPixelColor(png, x, startY);
            if (!ColorUtils.isEqual(startColor, color)) {
                endX = x;
                break;
            }

            for (let y = startY; y < endY; y++) {
                const color = this.getPixelColor(png, x, y);
                if (ColorUtils.isEqual(startColor, color)) {
                    continue;
                }

                if (y < endY) {
                    endY = y;
                    break;
                }
            }
        }

        return {
            tl: {
                x: startX,
                y: startY,
            },
            br: {
                x: endX,
                y: endY,
            },
        };
    }

    static setRectangleColor(
        png: PNGWithMetadata,
        box: BoundingBox,
        color: Color,
    ): void {
        for (let y = box.tl.y; y < box.br.y; y++) {
            for (let x = box.tl.x; x < box.br.x; x++) {
                this.setPixelColor(png, x, y, color);
            }
        }
    }
}
