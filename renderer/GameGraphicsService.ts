import GameObject from '@/object/GameObject';
import { RenderPass } from '@/object/RenderPass';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import CanvasUtils, { Context2D } from '@/utils/CanvasUtils';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import GameObjectGraphicsRendererFactory from '../object/GameObjectGraphicsRendererFactory';

export default class GameGraphicsService {
    private scale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private context: Context2D;
    private layersContext!: Context2D[];
    private canvasX = 0;
    private canvasY = 0;
    private targetGameSize;
    private showInvisible = false;

    constructor(
        canvas: HTMLCanvasElement,
        targetGameSize: number,
    ) {
        this.targetGameSize = targetGameSize;
        this.context = CanvasUtils.getContext(canvas, {
            alpha: false,
        });

        this.calculateDimensions();
    }

    calculateDimensions(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.context.canvas.width = width;
        this.context.canvas.height = height;
        this.layersContext = new Array<Context2D>();

        for (const _ of new Array(RenderPass.MAX)) {
            const canvas = CanvasUtils.create(width, height);
            const context = CanvasUtils.getContext(canvas);
            this.layersContext.push(context);
        }

        const minRenderSize = Math.max(width, height);
        this.scale = Math.ceil(minRenderSize / this.targetGameSize);

        this.gameWidth = width / this.scale;
        this.gameHeight = height / this.scale;

        this.gameWidth -= this.gameWidth % 2;
        this.gameHeight -= this.gameHeight % 2;
    }

    setShowInvisible(showInvisible: boolean): void {
        this.showInvisible = showInvisible;
    }

    getObjectRenderer(object: GameObject): GameObjectGraphicsRenderer {
        if (object.graphicsRenderer === undefined) {
            object.graphicsRenderer = GameObjectGraphicsRendererFactory
                .buildFromObject(object);
        }

        return object.graphicsRenderer;
    }

    renderObject(object: GameObject): void {
        const renderer = this.getObjectRenderer(object);
        const objectRelativeX = Math.floor(object.position.x) - this.canvasX;
        const objectRelativeY = Math.floor(object.position.y) - this.canvasY;
        const objectDrawX = objectRelativeX * this.scale;
        const objectDrawY = objectRelativeY * this.scale;
        renderer.render(this.layersContext,
            objectDrawX, objectDrawY, this.showInvisible);
    }

    renderObjectsOver(objects: Iterable<GameObject>): void {
        for (const object of objects) {
            const renderer = this.getObjectRenderer(object);
            renderer.update(this.scale);
            if (renderer.isRenderable()) {
                this.renderObject(object);
            }
        }
    }

    initializeRender(point: Point): void {
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.context.canvas.width,
            this.context.canvas.height);

        for (const context of this.layersContext) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        }

        this.canvasX = point.x - this.gameWidth / 2;
        this.canvasY = point.y - this.gameHeight / 2;
    }

    renderGhostObjectsOver(objects: Iterable<GameObject>): void {
        this.context.globalAlpha = 0.5;

        this.renderObjectsOver(objects);

        this.context.globalAlpha = 1;
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

    finalizeRender(): void {
        for (const context of this.layersContext) {
            this.context.drawImage(context.canvas, 0, 0);
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

    getWorldPosition(position: Point): Point {
        return {
            x: Math.floor(position.x / this.scale),
            y: Math.floor(position.y / this.scale),
        };
    }
}
