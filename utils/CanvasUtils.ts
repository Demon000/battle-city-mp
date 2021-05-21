export type Canvas = OffscreenCanvas | HTMLCanvasElement;
export type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export default class CanvasUtils {
    static create(width: number, height: number, dump?: false): Canvas;
    static create(width: number, height: number, dump: true): HTMLCanvasElement;
    static create(width: number, height: number, dump = false): Canvas {
        if (!dump && typeof OffscreenCanvas !== 'undefined') {
            return new OffscreenCanvas(width, height);
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        }
    }

    static dump(canvas: HTMLCanvasElement): void {
        const img = canvas.toDataURL('image/png');
        document.write(`<img src="${img}" />`);
    }

    static getContext(canvas: Canvas, options?: CanvasRenderingContext2DSettings): Context2D {
        const context = canvas.getContext('2d', options);
        if (!context) {
            throw new Error('Failed to create canvas context');
        }

        return context;
    }
}
