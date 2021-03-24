import GameObject from '@/object/GameObject';
import BoundingBox from '@/physics/bounding-box/BoundingBox';

export default class GameRenderService {
    private canvas;
    private gameToRenderSizeScale;
    private renderWidth;
    private renderHeight;
    private gameWidth;
    private gameHeight;
    private watchedObject: GameObject | undefined;
    context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, targetGameSize: number) {
        this.canvas = canvas;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to create canvas context');
        }
        this.context = context;

        this.renderWidth = canvas.width = window.innerWidth;
        this.renderHeight = canvas.height = window.innerHeight;

        const minRenderSize = Math.min(this.renderWidth, this.renderHeight);
        this.gameToRenderSizeScale = minRenderSize / targetGameSize;
        this.gameWidth = this.renderWidth / this.gameToRenderSizeScale;
        this.gameHeight = this.renderHeight / this.gameToRenderSizeScale;
    }

    renderObjects(objects: GameObject[]): void {
        console.log(objects);
    }

    setWatchedObject(object: GameObject | undefined): void {
        this.watchedObject = object;
    }

    getViewableMapBoundingBox(): BoundingBox | undefined {
        if (this.watchedObject === undefined) {
            return undefined;
        }

        return {
            tl: {
                x: this.watchedObject.position.x - this.gameWidth / 2,
                y: this.watchedObject.position.y - this.gameHeight / 2,
            },
            br: {
                x: this.watchedObject.position.x + this.gameWidth / 2,
                y: this.watchedObject.position.y + this.gameHeight / 2,
            },
        };
    }
}
