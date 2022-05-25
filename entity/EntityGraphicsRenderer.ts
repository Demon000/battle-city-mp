import { GraphicsRendererComponent } from '@/components/GraphicsRendererComponent';
import { PatternFillGraphicsComponent } from '@/components/PatternFillGraphicsComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { AnimatedImageDrawable } from '@/drawable/AnimatedImageDrawable';
import { DrawableType } from '@/drawable/DrawableType';
import { IDrawable } from '@/drawable/IDrawable';
import { ImageDrawable } from '@/drawable/ImageDrawable';
import { Entity } from '@/ecs/Entity';
import { Context2D } from '@/utils/CanvasUtils';
import { EntityDrawables } from './EntityDrawables';

export class EntityGraphicsRenderer {
    scale = 1;

    private filterMatchingDrawable(entity: Entity, drawable: IDrawable): boolean {
        if (drawable.properties.tests === undefined) {
            return true;
        }

        for (const test of drawable.properties.tests) {
            if (!test(entity)) {
                return false;
            }
        }

        return true;
    }

    private filterOutMissingDrawable(drawable: IDrawable | undefined | null): boolean {
        return drawable !== undefined && drawable !== null;
    }

    private findMatchingDrawables(entity: Entity): IDrawable[] | undefined {
        let drawables = EntityDrawables.getTypeDrawables(entity.type);
        if (drawables === undefined) {
            return undefined;
        }

        drawables = drawables.filter(drawable => {
            return this.filterMatchingDrawable(entity, drawable);
        });

        if (drawables.length === 0) {
            drawables = undefined;
        }

        return drawables;
    }

    private processPatternFillDrawable(
        entity: Entity,
        drawable: IDrawable,
    ): IDrawable | undefined {
        if (drawable.type !== DrawableType.IMAGE &&
            drawable.type !== DrawableType.ANIMATED_IMAGE) {
            return drawable;
        }

        if (!entity.hasComponent(PatternFillGraphicsComponent)) {
            return drawable;
        }

        const imageDrawable = drawable as ImageDrawable;

        const size = entity.getComponent(SizeComponent);
        const position = entity.getComponent(PositionComponent);
        let offsetX = 0;
        let offsetY = 0;

        if (imageDrawable.properties.fillRepeatWidth !== undefined) {
            offsetX = Math.abs(position.x) %
                imageDrawable.properties.fillRepeatWidth;
        }

        if (imageDrawable.properties.fillRepeatHeight !== undefined) {
            offsetY = Math.abs(position.y) %
                imageDrawable.properties.fillRepeatHeight;
        }

        return imageDrawable.fill({
            sourceOffsetX: offsetX,
            sourceOffsetY: offsetY,
            width: size.width,
            height: size.height,
        });
    }

    protected processDrawable(
        entity: Entity,
        drawable: IDrawable | undefined,
    ): IDrawable | undefined {
        if (drawable === undefined) {
            return drawable;
        }

        drawable = this.processPatternFillDrawable(entity, drawable);

        if (drawable === undefined) {
            return drawable;
        }

        drawable = drawable.scale(this.scale);

        if (drawable === undefined) {
            return drawable;
        }

        if (drawable.properties.processor !== undefined) {
            drawable = drawable.properties.processor.call(drawable, entity);
        }

        return drawable;
    }

    protected processDrawables(entity: Entity, drawables: IDrawable[]): IDrawable[] {
        return drawables
            .map(drawable => {
                return this.processDrawable(entity, drawable);
            })
            .filter(this.filterOutMissingDrawable, this) as IDrawable[];
    }

    update(entity: Entity, component: GraphicsRendererComponent): void {
        if (component.drawables === undefined) {
            return;
        }

        let drawables = this.findMatchingDrawables(entity);
        if (drawables !== undefined) {
            drawables = this.processDrawables(entity, drawables);
        }

        component.drawables = drawables;
    }

    private renderDrawable(
        entity: Entity,
        drawable: IDrawable | undefined,
        layersContext: Context2D[],
        drawX: number,
        drawY: number,
    ): void {
        if (drawable === undefined) {
            return;
        }

        if (drawable.type === DrawableType.ANIMATED_IMAGE) {
            const spawnTime = entity.getComponent(SpawnTimeComponent).value;
            drawable = (drawable as AnimatedImageDrawable).getCurrentDrawable(spawnTime);
        }

        if (drawable === undefined) {
            return;
        }

        const renderPass = drawable.getRenderPass();
        const context = layersContext[renderPass];

        drawable.draw(context, drawX, drawY);
    }

    render(
        entity: Entity,
        component: GraphicsRendererComponent,
        layersContext: Context2D[],
        drawX: number,
        drawY: number,
    ): void {
        if (component.drawables === undefined
            || component.drawables === null
            || component.drawables.length === 0) {
            return;
        }

        for (const drawable of component.drawables) {
            this.renderDrawable(entity, drawable, layersContext, drawX, drawY);
        }
    }
}
