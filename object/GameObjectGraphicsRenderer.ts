import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { AnimatedImageDrawable } from '@/drawable/AnimatedImageDrawable';
import { DrawableType } from '@/drawable/DrawableType';
import { IDrawable } from '@/drawable/IDrawable';
import { GameObject } from '@/object/GameObject';
import { Context2D } from '@/utils/CanvasUtils';
import { GameObjectDrawables } from './GameObjectDrawables';

export class GameObjectGraphicsRenderer<O extends GameObject = GameObject> {
    object;
    drawables?: IDrawable[] | null = null;
    scale = 1;

    constructor(object: O) {
        this.object = object;
    }

    private filterDrawableMatchingObject(drawable: IDrawable): boolean {
        if (drawable.properties.tests === undefined) {
            return true;
        }

        for (const test of drawable.properties.tests) {
            if (!test(this.object)) {
                return false;
            }
        }

        return true;
    }

    private filterOutMissingDrawable(drawable: IDrawable | undefined | null): boolean {
        return drawable !== undefined && drawable !== null;
    }

    private findDrawablesMatchingObject(): IDrawable[] | undefined {
        let drawables = GameObjectDrawables.getTypeDrawables(this.object.type);
        if (drawables === undefined) {
            return undefined;
        }

        drawables = drawables.filter(this.filterDrawableMatchingObject, this);

        if (drawables[0] === undefined) {
            return undefined;
        }

        return drawables.filter(this.filterOutMissingDrawable) as IDrawable[];
    }

    protected processDrawable(drawable: IDrawable | undefined): IDrawable | undefined {
        if (drawable !== undefined) {
            drawable = drawable.scale(this.scale);
        }

        if (drawable !== undefined && drawable.properties.processor !== undefined) {
            drawable = drawable.properties.processor.call(drawable, this.object);
        }

        return drawable;
    }

    protected processDrawables(drawables: (IDrawable | undefined)[]): IDrawable[] {
        return drawables
            .map(this.processDrawable, this)
            .filter(this.filterOutMissingDrawable, this) as IDrawable[];
    }

    update(scale: number, force = false): void {
        if (this.drawables === undefined) {
            return;
        }

        if (!this.object.graphicsDirty && !force && this.scale === scale) {
            return;
        }

        this.scale = scale;
        this.drawables = this.findDrawablesMatchingObject();
        if (this.drawables !== undefined) {
            this.drawables = this.processDrawables(this.drawables);
        }

        if (!force) {
            this.object.graphicsDirty = false;
        }
    }

    isRenderable(): boolean {
        return this.drawables !== undefined && this.drawables !== null && this.drawables.length !== 0;
    }

    renderDrawable(
        drawable: IDrawable | undefined,
        layersContext: Context2D[],
        drawX: number,
        drawY: number,
        showInvisible: boolean,
    ): void {
        if (drawable === undefined) {
            return;
        }

        if (drawable.type === DrawableType.ANIMATED_IMAGE) {
            const spawnTime = this.object.getComponent(SpawnTimeComponent).value;
            drawable = (drawable as AnimatedImageDrawable).getCurrentDrawable(spawnTime);
        }

        if (drawable === undefined) {
            return;
        }

        if (drawable.properties.isInvisible && !showInvisible) {
            return;
        }

        const renderPass = drawable.getRenderPass();
        const context = layersContext[renderPass];

        drawable.draw(context, drawX, drawY);
    }

    render(
        layersContext: Context2D[],
        drawX: number,
        drawY: number,
        showInvisible: boolean,
    ): void {
        if (this.drawables === undefined || this.drawables === null) {
            return;
        }

        for (const drawable of this.drawables) {
            this.renderDrawable(drawable, layersContext, drawX, drawY, showInvisible);
        }
    }
}
