import { GameObject } from '@/object/GameObject';
import { RenderPass } from '@/object/RenderPass';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { Point } from '@/physics/point/Point';
import { CanvasUtils, Context2D } from '@/utils/CanvasUtils';
import { RatioUtils } from '@/utils/RatioUtils';
import { GameObjectGraphicsRenderer } from '../object/GameObjectGraphicsRenderer';

export class GameGraphicsService {
    private scale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private contexts!: Context2D[];
    private canvasX = 0;
    private canvasY = 0;
    private showInvisible = false;
    private targetGameSize = 0;

    constructor(
        private canvases: HTMLCanvasElement[],
    ) {
        this.initializeContexts();
        this.calculateDimensions();
    }

    private initializeContexts(): void {
        this.contexts = new Array<Context2D>();

        for (const canvas of this.canvases) {
            const context = CanvasUtils.getContext(canvas);
            context.imageSmoothingEnabled = false;
            this.contexts.push(context);
        }
    }

    setTargetGameSize(targetGameSize: number): void {
        this.targetGameSize = targetGameSize;
        this.calculateDimensions();
    }

    calculateDimensions(): void {
        const visibleWidth = window.innerWidth;
        const visibleHeight = window.innerHeight;
        const width = RatioUtils.scaleForDevicePixelRatio(visibleWidth);
        const height = RatioUtils.scaleForDevicePixelRatio(visibleHeight);

        for (const canvas of this.canvases) {
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${visibleWidth}px`;
            canvas.style.height = `${visibleHeight}px`;
        }

        const minRenderSize = Math.min(width, height);
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
            object.graphicsRenderer = new GameObjectGraphicsRenderer(object);
        }

        return object.graphicsRenderer;
    }

    renderObject(object: GameObject): void {
        if (this.scale === 0) {
            return;
        }

        const renderer = this.getObjectRenderer(object);
        const objectRelativeX = Math.floor(object.position.x) - this.canvasX;
        const objectRelativeY = Math.floor(object.position.y) - this.canvasY;
        const objectDrawX = objectRelativeX * this.scale;
        const objectDrawY = objectRelativeY * this.scale;
        renderer.render(this.contexts,
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
        for (const context of this.contexts) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        }

        this.canvasX = point.x - this.gameWidth / 2;
        this.canvasY = point.y - this.gameHeight / 2;
    }

    renderGrid(gridSize: number): void {
        const context = this.contexts[RenderPass.GRID];
        context.strokeStyle = '#ffffff';

        const canvasOffsetX = this.canvasX % gridSize;
        const canvasOffsetY = this.canvasY % gridSize;

        let scaledY;
        let scaledX;

        scaledY = this.gameHeight * this.scale;
        for (let x = -canvasOffsetX; x < this.gameWidth; x +=  gridSize) {
            scaledX = x * this.scale;
            context.beginPath();
            context.moveTo(scaledX, 0);
            context.lineTo(scaledX, scaledY);
            context.stroke();
        }

        scaledX = this.gameWidth * this.scale;
        for (let y = -canvasOffsetY; y < this.gameHeight; y += gridSize) {
            scaledY = y * this.scale;
            context.beginPath();
            context.moveTo(0, scaledY);
            context.lineTo(scaledX, scaledY);
            context.stroke();
        }
    }

    getViewableMapBoundingBox(position: Point): BoundingBox | undefined {
        return BoundingBoxUtils.create(position.x - this.gameWidth / 2,
            position.y - this.gameHeight / 2,
            position.x + this.gameWidth / 2,
            position.y + this.gameHeight / 2);
    }

    getWorldPosition(position: Point): Point {
        return {
            x: Math.floor(position.x / this.scale),
            y: Math.floor(position.y / this.scale),
        };
    }
}
