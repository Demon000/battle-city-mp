import AnimatedImageDrawable from '@/drawable/AnimatedImageDrawable';
import { DrawableType } from '@/drawable/DrawableType';
import IDrawable from '@/drawable/IDrawable';
import GameObject from '@/object/GameObject';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Context2D } from '@/utils/CanvasUtils';
import GameObjectDrawables from './GameObjectDrawables';

export default class GameObjectGraphicsRenderer<O extends GameObject = GameObject> {
    object;
    drawables?: IDrawable[] | null = null;
    scale = 1;

    constructor(object: O) {
        this.object = object;
    }

    isDrawableMatchingMeta(drawable: IDrawable, objectMeta: ResourceMeta): boolean {
        if (drawable.properties.tests === undefined) {
            return true;
        }

        for (const test of drawable.properties.tests) {
            if (!test(objectMeta)) {
                return false;
            }
        }

        return true;
    }

    private findDrawableMatchingMeta(meta: ResourceMeta): IDrawable | undefined | null {
        const drawables = GameObjectDrawables.getTypeDrawables(this.object.type);
        if (drawables === undefined) {
            return undefined;
        }

        const drawable = drawables
            .find(d => this.isDrawableMatchingMeta(d, meta));
        if (drawable === undefined) {
            return null;
        }

        return drawable;
    }

    private filterOutMissingDrawable(drawable: IDrawable | undefined | null): boolean {
        return drawable !== undefined && drawable !== null;
    }

    private findDrawablesMatchingMetas(metas: ResourceMeta[]): IDrawable[] | undefined {
        const drawables = metas.map(this.findDrawableMatchingMeta, this);

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

    update(scale: number): void {
        /*
         * Metas were undefined, meaning that this game object will never have a sprite.
         */
        if (this.drawables === undefined) {
            return;
        }

        /*
         * Metas were either undefined, meaning that the game object will never have a sprite,
         * or null, meaning that it has no sprite right now.
         */
        const metas = this.object.graphicsMeta;
        if (metas === undefined || metas === null) {
            this.drawables = metas;
            return;
        }

        if (!this.object.graphicsMetaUpdated) {
            return;
        }

        this.scale = scale;
        const drawables = this.findDrawablesMatchingMetas(metas);
        if (drawables !== undefined) {
            this.drawables = this.processDrawables(drawables);
        }

        this.object.graphicsMetaUpdated = false;
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
    ): boolean {
        if (drawable === undefined) {
            return false;
        }

        if (drawable.type === DrawableType.ANIMATED_IMAGE) {
            drawable = (drawable as AnimatedImageDrawable).getCurrentDrawable(this.object.spawnTime);
        }

        if (drawable === undefined) {
            return false;
        }

        if (drawable.properties.isInvisible && !showInvisible) {
            return false;
        }

        const renderPass = drawable.getRenderPass();
        const context = layersContext[renderPass];

        drawable.draw(context, drawX, drawY);

        return false;
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
