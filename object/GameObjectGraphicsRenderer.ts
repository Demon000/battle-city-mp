import AnimatedImageDrawable from '@/drawable/AnimatedImageDrawable';
import DrawablePositionMatching from '@/drawable/DrawablePositionMatching';
import { DrawableType } from '@/drawable/DrawableType';
import IDrawable from '@/drawable/IDrawable';
import GameObject from '@/object/GameObject';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';
import { Context2D } from '@/utils/CanvasUtils';
import { MeshBuilder, Scene, AbstractMesh } from 'babylonjs';
import GameObjectDrawables from './GameObjectDrawables';
import ImageDrawable from '@/drawable/ImageDrawable';

export default class GameObjectGraphicsRenderer<O extends GameObject = GameObject> {
    object;
    drawables?: IDrawable[] | null = null;
    scale = 1;
    mesh;
    scene;
    setTexture = false;

    constructor(object: O, scene: Scene | undefined) {
        this.object = object;
        this.scene = scene;

        if (this.scene !== undefined) {
            this.mesh = MeshBuilder.CreateTiledBox('box', {
                width: object.width,
                height: object.depth,
                depth: object.height,
                tileWidth: object.width,
                tileHeight: object.height,
            }, scene) as AbstractMesh;
            this.mesh.receiveShadows = true;
        }
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

    private findDrawablesMatchingMetas(metas: ResourceMeta[]): IDrawable[] | undefined {
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

    protected processDrawable(drawable: IDrawable | undefined): IDrawable | undefined {
        if (drawable !== undefined) {
            drawable = drawable.scale(this.scale);
        }

        return drawable;
    }

    protected processDrawables(drawables: (IDrawable | undefined)[]): IDrawable[] {
        return drawables
            .map(this.processDrawable, this)
            .filter(this.filterOutMissingDrawable, this) as IDrawable[];
    }

    updateMeshPosition(): void {
        if (this.mesh === undefined) {
            return;
        }

        this.mesh.position.x = -this.object.position.x - this.object.width / 2;
        this.mesh.position.z = this.object.position.y + this.object.height / 2;
        this.mesh.position.y = this.object.positionZ + this.object.depth / 2;
    }

    update(scale: number): void {
        this.updateMeshPosition();

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

        /*
         * If our last metas were null, and our current metas is not null, or if our
         * drawables no longer match the metas, try to find drawables matching the metas.
         */
        if (this.drawables !== null
            && this.isDrawablesMatchingMetas(this.drawables, metas)
            && scale === this.scale) {
            return;
        }

        const drawables = this.findDrawablesMatchingMetas(metas);
        if (drawables !== undefined) {
            this.scale = scale;
            this.drawables = this.processDrawables(drawables);
        }

        if (this.drawables !== undefined && this.drawables !== null
            && this.scene !== undefined && this.mesh !== undefined) {
            let drawable: IDrawable | undefined = this.drawables[0];
            if (drawable.type === DrawableType.ANIMATED_IMAGE) {
                drawable = (drawable as AnimatedImageDrawable).getCurrentDrawable(this.object.spawnTime);
            }

            if (drawable !== undefined && drawable.type === DrawableType.IMAGE) {
                const imageDrawable = drawable as ImageDrawable;
                this.mesh.material = imageDrawable.getMaterial(this.scene);

                let radians;
                if (this.object.direction === Direction.UP) {
                    radians = 1 * (Math.PI / 2);
                } else if (this.object.direction === Direction.RIGHT) {
                    radians = 2 * (Math.PI / 2);
                } else if (this.object.direction === Direction.DOWN) {
                    radians = 3 * (Math.PI / 2);
                } else if (this.object.direction === Direction.LEFT) {
                    radians = 4 * (Math.PI / 2);
                } else {
                    throw new Error('Invalid direction');
                }

                this.mesh.rotation.y = radians;
            }
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
    ): boolean {
        if (this.scene !== undefined) {
            return false;
        }

        if (drawable === undefined) {
            return false;
        }

        if (drawable.type === DrawableType.ANIMATED_IMAGE) {
            drawable = (drawable as AnimatedImageDrawable).getCurrentDrawable(this.object.spawnTime);
        }

        if (drawable === undefined) {
            return false;
        }

        if (drawable.meta.isInvisible && !showInvisible) {
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
