export type Canvas = OffscreenCanvas | HTMLCanvasElement;

export default class CanvasUtils {
    static create(width: number, height: number): Canvas {
        if (typeof OffscreenCanvas !== 'undefined') {
            return new OffscreenCanvas(width, height);
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        }
    }
}
