import GameObject from '@/object/GameObject';
import BoundingBox from '@/physics/bounding-box/BoundingBox';
import Point from '@/physics/point/Point';
import MapRepository from '@/utils/MapRepository';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import GameObjectGraphicsRendererFactory from '../object/GameObjectGraphicsRendererFactory';

export default class GameGraphicsService {
    private gameToRenderSizeScale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private canvas;
    private canvasX = 0;
    private canvasY = 0;
    private pass = 0;
    private targetGameSize;
    private context;
    private objectGraphicsRendererRepository;

    constructor(
        objectGraphicsRendererRepository: MapRepository<number, GameObjectGraphicsRenderer>,
        canvas: HTMLCanvasElement,
        targetGameSize: number,
    ) {
        this.objectGraphicsRendererRepository = objectGraphicsRendererRepository;
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
        this.gameToRenderSizeScale = Math.ceil(minRenderSize / this.targetGameSize);
        this.gameWidth = this.canvas.width / this.gameToRenderSizeScale;
        this.gameWidth -= this.gameWidth % 2;
        this.gameHeight = this.canvas.height / this.gameToRenderSizeScale;
        this.gameHeight -= this.gameHeight % 2;
        this.objectGraphicsRendererRepository.clear();
    }

    getObjectRenderer(object: GameObject): GameObjectGraphicsRenderer {
        let objectRenderer = this.objectGraphicsRendererRepository.find(object.id);
        if (objectRenderer === undefined) {
            objectRenderer = GameObjectGraphicsRendererFactory
                .buildFromObject(this.context, object, this.gameToRenderSizeScale);
            this.objectGraphicsRendererRepository.add(object.id, objectRenderer);
        }

        return objectRenderer;
    }

    removeObjectGraphicsRenderer(objectId: number): void {
        this.objectGraphicsRendererRepository.remove(objectId);
    }

    renderObjectsPrepareFilter(object: GameObject): boolean {
        const renderer = this.getObjectRenderer(object);
        renderer.update();
        return renderer.isRenderable();
    }

    renderObjectsPrepare(objects: GameObject[]): GameObject[] {
        return objects.filter(this.renderObjectsPrepareFilter, this);
    }

    renderObjectsPassFilter(object: GameObject): boolean {
        const renderer = this.getObjectRenderer(object);
        return renderer.renderPass(this.pass, this.canvasX, this.canvasY);
    }

    renderObjects(objects: GameObject[], point: Point): void {
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvasX = point.x - this.gameWidth / 2;
        this.canvasY = point.y - this.gameHeight / 2;
        this.pass = 0;
        let renderObjects = this.renderObjectsPrepare(objects);
        while (renderObjects.length) {
            renderObjects = renderObjects.filter(this.renderObjectsPassFilter, this);
            this.pass++;
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

    clear(): void {
        this.objectGraphicsRendererRepository.clear();
    }
}
