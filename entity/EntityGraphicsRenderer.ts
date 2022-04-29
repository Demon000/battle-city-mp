import { DirtyGraphicsComponent } from '@/components/DirtyGraphicsComponent';
import { DynamicSizeComponent } from '@/components/DynamicSizeComponent';
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

export class EntityGraphicsRenderer<O extends Entity = Entity> {
    entity;
    drawables?: IDrawable[] | null = null;
    scale = 1;

    constructor(entity: O) {
        this.entity = entity;
    }

    private filterMatchingDrawable(drawable: IDrawable): boolean {
        if (drawable.properties.tests === undefined) {
            return true;
        }

        for (const test of drawable.properties.tests) {
            if (!test(this.entity)) {
                return false;
            }
        }

        return true;
    }

    private filterOutMissingDrawable(drawable: IDrawable | undefined | null): boolean {
        return drawable !== undefined && drawable !== null;
    }

    private findMatchingDrawables(): IDrawable[] | undefined {
        let drawables = EntityDrawables.getTypeDrawables(this.entity.type);
        if (drawables === undefined) {
            return undefined;
        }

        drawables = drawables.filter(this.filterMatchingDrawable, this);
        if (drawables.length === 0) {
            drawables = undefined;
        }

        return drawables;
    }

    private processDynamicSizeDrawable(
        drawable: IDrawable | undefined,
    ): IDrawable | undefined {
        if (drawable === undefined) {
            return drawable;
        }

        if (drawable.type !== DrawableType.IMAGE &&
            drawable.type !== DrawableType.ANIMATED_IMAGE) {
            return drawable;
        }

        const dynamicSize = this.entity.findComponent(DynamicSizeComponent);
        if (dynamicSize === undefined) {
            return drawable;
        }

        const imageDrawable = drawable as ImageDrawable;

        const size = this.entity.getComponent(SizeComponent);
        const position = this.entity.getComponent(PositionComponent);
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

    protected processDrawable(drawable: IDrawable | undefined): IDrawable | undefined {
        drawable = this.processDynamicSizeDrawable(drawable);

        if (drawable !== undefined) {
            drawable = drawable.scale(this.scale);
        }

        if (drawable !== undefined && drawable.properties.processor !== undefined) {
            drawable = drawable.properties.processor.call(drawable, this.entity);
        }

        return drawable;
    }

    protected processDrawables(drawables: IDrawable[]): IDrawable[] {
        return drawables
            .map(this.processDrawable, this)
            .filter(this.filterOutMissingDrawable, this) as IDrawable[];
    }

    update(scale: number, force = false): void {
        if (this.drawables === undefined) {
            return;
        }

        const dirtyGraphicsComponent = this.entity
            .findComponent(DirtyGraphicsComponent);

        if (dirtyGraphicsComponent === undefined && !force && this.scale === scale) {
            return;
        }

        this.scale = scale;
        this.drawables = this.findMatchingDrawables();
        if (this.drawables !== undefined) {
            this.drawables = this.processDrawables(this.drawables);
        }

        if (dirtyGraphicsComponent !== undefined) {
            dirtyGraphicsComponent.remove();
        }
    }

    private renderDrawable(
        drawable: IDrawable | undefined,
        layersContext: Context2D[],
        drawX: number,
        drawY: number,
    ): void {
        if (drawable === undefined) {
            return;
        }

        if (drawable.type === DrawableType.ANIMATED_IMAGE) {
            const spawnTime = this.entity.getComponent(SpawnTimeComponent).value;
            drawable = (drawable as AnimatedImageDrawable).getCurrentDrawable(spawnTime);
        }

        if (drawable === undefined) {
            return;
        }

        const renderPass = drawable.getRenderPass();
        const context = layersContext[renderPass];

        drawable.draw(context, drawX, drawY);
    }

    render(layersContext: Context2D[], drawX: number, drawY: number): void {
        if (this.drawables === undefined
            || this.drawables === null
            || this.drawables.length === 0) {
            return;
        }

        for (const drawable of this.drawables) {
            this.renderDrawable(drawable, layersContext, drawX, drawY);
        }
    }
}
