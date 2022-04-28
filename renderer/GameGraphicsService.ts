import { DirtyGraphicsComponent } from '@/components/DirtyGraphicsComponent';
import { GraphicDependenciesComponent } from '@/components/GraphicDependenciesComponent';
import { EntityId } from '@/ecs/EntityId';
import { Registry } from '@/ecs/Registry';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { Point } from '@/physics/point/Point';
import { PositionComponent } from '@/components/PositionComponent';
import { CanvasUtils, Context2D } from '@/utils/CanvasUtils';
import { RatioUtils } from '@/utils/RatioUtils';
import { GameObjectGraphicsRenderer } from '../object/GameObjectGraphicsRenderer';
import { ComponentRegistry } from '@/ecs/ComponentRegistry';
import { ClazzOrTag } from '@/ecs/Component';
import { GraphicsRendererComponent } from '@/components/GraphicsRendererComponent';
import { Entity } from '@/ecs/Entity';

export class GameGraphicsService {
    private scale = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    private contexts!: Context2D[];
    private canvasX = 0;
    private canvasY = 0;
    private maxVisibleGameSize = 0;

    constructor(
        private registry: Registry,
        private canvases: HTMLCanvasElement[],
    ) {
        this.initializeContexts();
        this.calculateDimensions();
    }

    private initializeContexts(): void {
        this.contexts = new Array<Context2D>();

        for (const [renderPass, canvas] of this.canvases.entries()) {
            const options = {
                alpha: true,
            };

            if (renderPass === 0) {
                options.alpha = false;
            }

            const context = CanvasUtils.getContext(canvas, options);
            context.imageSmoothingEnabled = false;

            this.contexts.push(context);
        }
    }

    setMaxVisibleGameSize(maxVisibleGameSize: number): void {
        this.maxVisibleGameSize = maxVisibleGameSize;
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

        const maxRenderSize = Math.max(width, height);
        this.scale = Math.ceil(maxRenderSize / this.maxVisibleGameSize);

        this.gameWidth = width / this.scale;
        this.gameHeight = height / this.scale;
    }

    getObjectRenderer(object: Entity): GameObjectGraphicsRenderer {
        const graphicsRendererComponent = object.getComponent(GraphicsRendererComponent);
        if (graphicsRendererComponent.renderer === undefined) {
            graphicsRendererComponent.renderer = new GameObjectGraphicsRenderer(object);
        }

        return graphicsRendererComponent.renderer;
    }

    _renderObject(object: Entity, drawX: number, drawY: number): void {
        const renderer = this.getObjectRenderer(object);
        renderer.update(this.scale);
        if (!renderer.isRenderable()) {
            return;
        }

        renderer.render(this.contexts, drawX, drawY);
    }

    renderObject(object: Entity): void {
        if (this.scale === 0) {
            return;
        }

        const position = object.getComponent(PositionComponent);
        const objectRelativeX = Math.floor(position.x) - this.canvasX;
        const objectRelativeY = Math.floor(position.y) - this.canvasY;
        const objectDrawX = objectRelativeX * this.scale;
        const objectDrawY = objectRelativeY * this.scale;
        this._renderObject(object, objectDrawX, objectDrawY);
    }

    renderObjects(objects: Iterable<Entity>): void {
        for (const object of objects) {
            this.renderObject(object);
        }
    }

    initializeRender(point: Point): void {
        for (const [renderPass, context] of this.contexts.entries()) {
            if (renderPass === 0) {
                context.fillStyle = 'black';
                context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            } else {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            }
        }

        this.canvasX = point.x - this.gameWidth / 2;
        this.canvasY = point.y - this.gameHeight / 2;
    }

    getViewableMapBoundingBox(position: Point): BoundingBox | undefined {
        return BoundingBoxUtils.create(position.x - this.gameWidth / 2,
            position.y - this.gameHeight / 2,
            position.x + this.gameWidth / 2,
            position.y + this.gameHeight / 2);
    }

    processObjectsDirtyGraphics(): void {
        for (const component of this.registry.getComponents(DirtyGraphicsComponent)) {
            const object = component.entity;
            const renderer = this.getObjectRenderer(object);
            renderer.update(this.scale, true);
        }
    }

    processObjectsGraphicsDependencies(
        entityId: EntityId,
        clazzOrTag: ClazzOrTag,
    ): void {
        const entity = this.registry.getEntityById(entityId);
        const component = entity.findComponent(GraphicDependenciesComponent);
        if (component === undefined) {
            return;
        }

        const clazz = ComponentRegistry.lookup(clazzOrTag);
        if (!(clazz.tag in component.components)
            && !(clazz.name in component.components)) {
            return;
        }

        entity.upsertComponent(DirtyGraphicsComponent, undefined, {
            silent: true,
        });
    }
}
