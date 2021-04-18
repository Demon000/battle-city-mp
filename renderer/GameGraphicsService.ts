import GameObject from '@/object/GameObject';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import GameObjectGraphicsRendererFactory from '../object/GameObjectGraphicsRendererFactory';

export default class GameGraphicsService {
    private scale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private canvas;
    private canvasX = 0;
    private canvasY = 0;
    private pass = 0;
    private targetGameSize;
    private context;

    constructor(
        canvas: HTMLCanvasElement,
        targetGameSize: number,
    ) {
        this.canvas = canvas;
        this.targetGameSize = targetGameSize;

        const context = canvas.getContext('2d', {
            alpha: false,
        });
        if (!context) {
            throw new Error('Failed to create canvas context');
        }
        this.context = context;

        this.calculateDimensions();
    }

    calculateDimensions(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const minRenderSize = Math.max(this.canvas.width, this.canvas.height);
        this.scale = Math.ceil(minRenderSize / this.targetGameSize);
        this.gameWidth = this.canvas.width / this.scale;
        this.gameWidth -= this.gameWidth % 2;
        this.gameHeight = this.canvas.height / this.scale;
        this.gameHeight -= this.gameHeight % 2;
    }

    getObjectRenderer(object: GameObject): GameObjectGraphicsRenderer {
        if (object.graphicsRenderer === undefined) {
            object.graphicsRenderer = GameObjectGraphicsRendererFactory
                .buildFromObject(object);
        }

        return object.graphicsRenderer;
    }

    renderObjectsPrepareFilter(object: GameObject): boolean {
        const renderer = this.getObjectRenderer(object);
        renderer.update(this.scale);
        return renderer.isRenderable();
    }

    renderObjectsPrepare(objects: GameObject[]): GameObject[] {
        return objects.filter(this.renderObjectsPrepareFilter, this);
    }

    renderObjectsPassFilter(object: GameObject): boolean {
        const renderer = this.getObjectRenderer(object);
        const objectRelativeX = Math.floor(object.position.x) - this.canvasX;
        const objectRelativeY = Math.floor(object.position.y) - this.canvasY;
        const objectDrawX = objectRelativeX * this.scale;
        const objectDrawY = objectRelativeY * this.scale;
        return renderer.renderPass(this.context, this.pass, objectDrawX, objectDrawY);
    }

    renderObjectsOver(objects: GameObject[], point: Point): void {
        this.canvasX = point.x - this.gameWidth / 2;
        this.canvasY = point.y - this.gameHeight / 2;

        this.pass = 0;
        let renderObjects = this.renderObjectsPrepare(objects);
        while (renderObjects.length) {
            renderObjects = renderObjects.filter(this.renderObjectsPassFilter, this);
            this.pass++;
        }
    }

    renderObjects(objects: GameObject[], point: Point): void {
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderObjectsOver(objects, point);
    }

    renderGrid(gridSize: number): void {
        this.context.strokeStyle = '#ffffff';
        const canvasOffsetX = this.canvasX % gridSize;
        const canvasOffsetY = this.canvasY % gridSize;

        let scaledY;
        let scaledX;

        scaledY = this.gameHeight * this.scale;
        for (let x = -canvasOffsetX; x < this.gameWidth; x +=  gridSize) {
            scaledX = x * this.scale;
            this.context.beginPath();
            this.context.moveTo(scaledX, 0);
            this.context.lineTo(scaledX, scaledY);
            this.context.stroke();
        }

        scaledX = this.gameWidth * this.scale;
        for (let y = -canvasOffsetY; y < this.gameHeight; y += gridSize) {
            scaledY = y * this.scale;
            this.context.beginPath();
            this.context.moveTo(0, scaledY);
            this.context.lineTo(scaledX, scaledY);
            this.context.stroke();
        }
    }

    getViewableMapBoundingBox(position: Point): BoundingBox | undefined {
        return {
            tl: {
                x: position.x - this.gameWidth / 2,
                y: position.y - this.gameHeight / 2,
            },
            br: {
                x: position.x + this.gameWidth / 2,
                y: position.y + this.gameHeight / 2,
            },
        };
    }
}
