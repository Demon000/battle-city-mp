import AnimatedImageDrawable from '@/drawable/AnimatedImageDrawable';
import DrawablePositionMatching from '@/drawable/DrawablePositionMatching';
import { DrawableType } from '@/drawable/DrawableType';
import IDrawable from '@/drawable/IDrawable';
import GameObject from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';
import GameObjectDrawables from './GameObjectDrawables';

export interface RenderPassFilterContext<O> {
    object: O;
    context: CanvasRenderingContext2D;
    drawX: number;
    drawY: number;
    pass: number;
    showInvisible: boolean;
}

export interface ProcessDrawableContext<O> {
    object: O;
    scale: number;
}

export default class GameObjectGraphicsRenderer<O extends GameObject = GameObject> {
    object;
    drawables?: IDrawable[] | null = null;
    processedDrawables?: IDrawable[];

    constructor(object: O) {
        this.object = object;
    }

    private isMatchingPosition(positionMatching: DrawablePositionMatching, position: Point): boolean {
        const x = Math.floor(Math.abs(position.x % positionMatching.mod / positionMatching.divide));
        const y = Math.floor(Math.abs(position.y % positionMatching.mod / positionMatching.divide));

        return positionMatching.equals.some(p => p.x === x && p.y === y);
    }

    private isMatchingDirection(setDirection: Direction, direction: Direction): boolean {
        return setDirection === direction;
    }

    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (drawableMeta.direction !== undefined) {
            if (objectMeta.direction === undefined) {
                return false;
            }

            if (!this.isMatchingDirection(drawableMeta.direction, objectMeta.direction)) {
                return false;
            }
        }

        if (drawableMeta.position !== undefined) {
            if (objectMeta.position === undefined) {
                return false;
            }

            if (!this.isMatchingPosition(drawableMeta.position, objectMeta.position)) {
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
            .find(d => d.meta === undefined
                || this.isDrawableMetaEqual(d.meta, meta));
        if (drawable === undefined) {
            return null;
        }

        return drawable;
    }

    private filterOutMissingDrawable(drawable: IDrawable | undefined | null): boolean {
        return drawable !== undefined && drawable !== null;
    }

    private findDrawablesMatchingMetas(type: GameObjectType, metas: ResourceMeta[]): IDrawable[] | undefined {
        const drawables = metas.map(this.findDrawableMatchingMeta, this);

        if (drawables[0] === undefined) {
            return undefined;
        }

        return drawables.filter(this.filterOutMissingDrawable) as IDrawable[];
    }

    private isDrawablesMatchingMetas(drawables: IDrawable[], metas: ResourceMeta[]): boolean {
        if (metas.length !== drawables.length) {
            return false;
        }

        for (let i = 0; i < metas.length; i++) {
            const drawable = drawables[i];
            const meta = metas[i];
            if (drawable.meta !== undefined && !this.isDrawableMetaEqual(drawable.meta, meta)) {
                return false;
            }
        }

        return true;
    }

    protected processDrawable(
        this: ProcessDrawableContext<O>,
        drawable: IDrawable | undefined,
    ): IDrawable | undefined {
        if (drawable !== undefined) {
            drawable = drawable.scale(this.scale);
        }

        return drawable;
    }

    protected processDrawables(drawables: (IDrawable | undefined)[], scale: number): IDrawable[] {
        return drawables.map(this.processDrawable, {
            object: this.object,
            scale,
        }).filter(this.filterOutMissingDrawable) as IDrawable[];
    }

    update(scale: number): void {
        if (this.drawables === undefined) {
            return;
        }

        const metas = this.object.graphicsMeta;
        if (metas === undefined) {
            this.drawables = undefined;
            return;
        }

        if (metas === null) {
            this.drawables = null;
            return;
        }

        if (this.drawables === null
            || !this.isDrawablesMatchingMetas(this.drawables, metas)) {
            this.drawables = this.findDrawablesMatchingMetas(this.object.type, metas);
        }
    
        /*
         * Scale now, before updating the current drawable, to prevent losing it.
         * TODO: keep current drawable across scaling operations?
         */
        if (this.drawables !== undefined) {
            this.processedDrawables = this.processDrawables(this.drawables, scale);
        }
    }

    isRenderable(): boolean {
        return this.processedDrawables !== undefined && this.processedDrawables.length !== 0;
    }

    renderPassFilter(this: RenderPassFilterContext<O>, drawable: IDrawable | undefined): boolean {
        if (drawable === undefined) {
            return false;
        }

        if (drawable.type === DrawableType.ANIMATED_IMAGE) {
            drawable = (drawable as AnimatedImageDrawable).getCurrentDrawable(this.object.spawnTime);
        }

        if (drawable === undefined) {
            return false;
        }

        const isRenderPass = drawable.isRenderPass(this.pass);
        if (!isRenderPass) {
            return true;
        }

        if (drawable.meta.isInvisible && !this.showInvisible) {
            return false;
        }

        drawable.draw(this.context, this.drawX, this.drawY);

        return false;
    }

    renderPass(
        context: CanvasRenderingContext2D,
        pass: number,
        drawX: number,
        drawY: number,
        showInvisible: boolean,
    ): boolean {
        if (this.processedDrawables === undefined) {
            return false;
        }

        this.processedDrawables = this.processedDrawables.filter(this.renderPassFilter, {
            object: this.object,
            context,
            drawX,
            drawY,
            pass,
            showInvisible,
        });

        return this.processedDrawables.length !== 0;
    }
}
