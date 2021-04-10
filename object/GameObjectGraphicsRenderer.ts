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

export default class GameObjectGraphicsRenderer<O extends GameObject = GameObject> {
    object;
    scale;
    drawables?: IDrawable[] | null = null;
    context?: CanvasRenderingContext2D;
    objectDrawX = 0;
    objectDrawY = 0;
    pass = 0;

    constructor(context: CanvasRenderingContext2D, object: O, scale: number) {
        this.context = context;
        this.object = object;
        this.scale = scale;
    }

    private isMatchingPosition(positionMatching: DrawablePositionMatching, position: Point): boolean {
        const x = position.x % positionMatching.mod / positionMatching.divide;
        const y = position.y % positionMatching.mod / positionMatching.divide;

        return positionMatching.equals.some(p => p.x === x && p.y === y);
    }

    private isMatchingDirection(setDirection: Direction, direction: Direction): boolean {
        return setDirection === direction;
    }

    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (drawableMeta.direction !== undefined) {
            if (drawableMeta.direction === undefined) {
                return false;
            }

            if (!this.isMatchingDirection(drawableMeta.direction, objectMeta.direction as Direction)) {
                return false;
            }
        }

        if (drawableMeta.position !== undefined) {
            if (drawableMeta.position === undefined) {
                return false;
            }

            if (!this.isMatchingPosition(drawableMeta.position, objectMeta.position as Point)) {
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
            .find(drawable => drawable.meta === undefined
                || this.isDrawableMetaEqual(drawable.meta, meta));
        if (drawable === undefined) {
            return null;
        }

        return drawable;
    }

    private findDrawablesMatchingMetasFilter(drawable: IDrawable | undefined | null): boolean {
        return drawable !== undefined && drawable !== null;
    }

    private findDrawablesMatchingMetas(type: GameObjectType, metas: ResourceMeta[]): IDrawable[] | undefined {
        const drawables = metas.map(this.findDrawableMatchingMeta, this);

        if (drawables[0] === undefined) {
            return undefined;
        }

        return drawables.filter(this.findDrawablesMatchingMetasFilter) as IDrawable[];
    }

    private isDrawablesMatchingMetas(drawables: IDrawable[], metas: ResourceMeta[]): boolean {
        if (metas.length !== drawables.length) {
            return false;
        }

        for (let i = 0; i < metas.length; i++) {
            const drawable = drawables[i];
            const meta = metas[i];
            if (drawable.meta !== undefined && this.isDrawableMetaEqual(drawable.meta, meta)) {
                return false;
            }
        }

        return true;
    }

    protected processDrawable(drawable: IDrawable): IDrawable {
        return drawable.scale(this.scale);
    }

    update(): void {
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
            this.drawables = this.drawables.map(this.processDrawable, this);
        }

        if (this.drawables === undefined) {
            return;
        }

        this.drawables.forEach(drawable => {
            if (drawable.type === DrawableType.ANIMATED) {
                (drawable as AnimatedImageDrawable).updateCurrentDrawable(this.object.spawnTime);
            }
        });
    }

    isRenderable(): boolean {
        return this.drawables !== undefined && this.drawables !== null && this.drawables.length !== 0;
    }

    renderPassFilter(drawable: IDrawable): boolean {
        if (this.context === undefined) {
            return true;
        }

        const isRenderPass = drawable.isRenderPass(this.pass);
        if (!isRenderPass) {
            return true;
        }

        drawable.draw(this.context, this.objectDrawX, this.objectDrawY);

        return false;
    }

    renderPass(pass: number, canvasX: number, canvasY: number): boolean {
        if (!this.drawables) {
            return false;
        }

        const objectRelativeX = Math.floor(this.object.position.x) - canvasX;
        const objectRelativeY = Math.floor(this.object.position.y) - canvasY;
        const objectDrawX = objectRelativeX * this.scale;
        const objectDrawY = objectRelativeY * this.scale;
        this.objectDrawX = objectDrawX;
        this.objectDrawY = objectDrawY;
        this.pass = pass;

        this.drawables = this.drawables.filter(this.renderPassFilter, this);

        return this.drawables.length !== 0;
    }
}
