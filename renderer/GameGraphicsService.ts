import { DirtyGraphicsComponent } from '@/components/DirtyGraphicsComponent';
import { GraphicDependenciesComponent } from '@/components/GraphicDependenciesComponent';
import { Registry } from '@/ecs/Registry';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { Point } from '@/physics/point/Point';
import { PositionComponent } from '@/components/PositionComponent';
import { CanvasUtils, Context2D } from '@/utils/CanvasUtils';
import { RatioUtils } from '@/utils/RatioUtils';
import { ClazzOrTag, Component } from '@/ecs/Component';
import { GraphicsRendererComponent } from '@/components/GraphicsRendererComponent';
import { Entity } from '@/ecs/Entity';
import { EntityGraphicsRenderer } from '@/entity/EntityGraphicsRenderer';

export class GameGraphicsService {
    private gameWidth = 0;
    private gameHeight = 0;
    private contexts!: Context2D[];
    private canvasX = 0;
    private canvasY = 0;
    private maxVisibleGameSize = 0;

    constructor(
        private registry: Registry,
        private renderer: EntityGraphicsRenderer,
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
        this.renderer.scale = Math.ceil(maxRenderSize / this.maxVisibleGameSize);

        for (const entity of
            this.registry.getEntitiesWithComponent(GraphicsRendererComponent)) {
            entity.upsertSharedComponent(DirtyGraphicsComponent, {
                silent: true,
            });
        }

        this.gameWidth = width / this.renderer.scale;
        this.gameHeight = height / this.renderer.scale;
    }

    _renderEntity(entity: Entity, drawX: number, drawY: number): void {
        const graphicsRendererComponent = entity
            .findComponent(GraphicsRendererComponent);
        if (graphicsRendererComponent === undefined) {
            return;
        }

        this.renderer.render(entity, graphicsRendererComponent, this.contexts,
            drawX, drawY);
    }

    renderEntity(entity: Entity): void {
        if (this.renderer.scale === 0) {
            return;
        }

        const position = entity.getComponent(PositionComponent);
        const relativeX = Math.floor(position.x) - this.canvasX;
        const relativeY = Math.floor(position.y) - this.canvasY;
        const drawX = relativeX * this.renderer.scale;
        const drawY = relativeY * this.renderer.scale;
        this._renderEntity(entity, drawX, drawY);
    }

    renderEntites(entities: Iterable<Entity>): void {
        for (const entity of entities) {
            this.renderEntity(entity);
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

    processDirtyGraphics(): void {
        for (const entity of this.registry.getEntitiesWithComponent(DirtyGraphicsComponent)) {
            const graphicsRendererComponent = entity
                .getComponent(GraphicsRendererComponent);

            this.renderer.update(entity, graphicsRendererComponent);

            for (const rendererEntity of graphicsRendererComponent.entities) {
                rendererEntity.removeComponent(DirtyGraphicsComponent, {
                    silent: true,
                    optional: true,
                });
            }
        }
    }

    processGraphicsDependencies<C extends Component>(
        entity: Entity,
        clazzOrTag: ClazzOrTag<C>,
    ): void {
        const component = entity.findComponent(GraphicDependenciesComponent);
        if (component === undefined) {
            return;
        }

        const clazz = this.registry.lookup(clazzOrTag);
        if (!(clazz.tag in component.components)
            && !(clazz.name in component.components)) {
            return;
        }

        entity.upsertSharedComponent(DirtyGraphicsComponent, {
            silent: true,
        });
    }
}
