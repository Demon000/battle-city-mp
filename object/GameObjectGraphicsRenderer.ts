import GameObject from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { ISprite, ISpriteSet, ISpriteSetPositionMatching, ResourceMeta } from '@/object/IGameObjectProperties';
import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export default class GameObjectGraphicsRenderer {
    object;
    context;
    sets?: ISpriteSet[] | null = [];
    sprites?: ISprite[] | null;

    constructor(object: GameObject, context: CanvasRenderingContext2D) {
        this.object = object;
        this.context = context;
    }

    isSpriteSetMetaEqual(_setMeta: ResourceMeta, _objectMeta: ResourceMeta): boolean {
        return true;
    }

    private findSpriteSets(type: GameObjectType): ISpriteSet[] | undefined {
        const properties = GameObjectProperties.getTypeProperties(type);
        return properties.spriteSets;
    }

    private isSpriteSetMatchingPosition(setPosition: ISpriteSetPositionMatching, position: Point): boolean {
        const x = position.x % setPosition.mod / setPosition.divide;
        const y = position.y % setPosition.mod / setPosition.divide;

        return setPosition.equals.some(p => p.x === x && p.y === y);
    }

    private isSpriteSetMatchingDirection(setDirection: Direction, direction: Direction): boolean {
        return setDirection === direction;
    }

    private isSpriteSetMatchingMeta(set: ISpriteSet, meta: ResourceMeta): boolean {
        if (set.direction !== undefined) {
            if (meta.direction === undefined) {
                return false;
            }

            if (!this.isSpriteSetMatchingDirection(set.direction, meta.direction as Direction)) {
                return false;
            }
        }

        if (set.position !== undefined) {
            if (meta.position === undefined) {
                return false;
            }

            if (!this.isSpriteSetMatchingPosition(set.position, meta.position as Point)) {
                return false;
            }
        }

        if (set.meta !== undefined && !this.isSpriteSetMetaEqual(set.meta, meta)) {
            return false;
        }

        return true;
    }

    private findSpriteSetMatchingMeta(type: GameObjectType, meta: ResourceMeta): ISpriteSet | undefined | null {
        const sets = this.findSpriteSets(type);
        if (sets === undefined) {
            return undefined;
        }

        for (const set of sets) {
            if (this.isSpriteSetMatchingMeta(set, meta)) {
                return set;
            }
        }

        return null;
    }

    private findSpriteSetsMatchingMetas(type: GameObjectType, metas: ResourceMeta[]): ISpriteSet[] | undefined {
        const sets = [];

        for (const meta of metas) {
            const set = this.findSpriteSetMatchingMeta(type, meta);
            if (set !== undefined && set !== null) {
                sets.push(set);
            } else if (set === undefined) {
                return undefined;
            }
        }

        return sets;
    }

    private isSpriteSetsMatchingMetas(sets: ISpriteSet[], metas: ResourceMeta[]): boolean {
        if (metas.length !== sets.length) {
            return false;
        }

        for (let i = 0; i < metas.length; i++) {
            if (!this.isSpriteSetMatchingMeta(sets[i], metas[i])) {
                return false;
            }
        }

        return true;
    }

    private updateSpriteSets(): void {
        if (this.sets === undefined) {
            return;
        }

        const metas = this.object.graphicsMeta;
        if (metas === undefined) {
            this.sets = undefined;
            return;
        }

        if (metas === null) {
            this.sets = null;
            return;
        }

        if (this.sets !== null
            && this.isSpriteSetsMatchingMetas(this.sets, metas)) {
            return;
        }

        this.sets = this.findSpriteSetsMatchingMetas(this.object.type, metas);
    }

    private getStaticSprite(set: ISpriteSet): ISprite {
        return set.steps[0];
    }

    private getAnimationSprite(set: ISpriteSet, referenceTime: number): ISprite | undefined {
        if (set.duration === undefined) {
            throw new Error('Invalid call to find animation sprite when sprite set is not animated');
        }

        let currentAnimationTime = (Date.now() - referenceTime);
        if (set.loop === undefined || set.loop === true) {
            currentAnimationTime %= set.duration;
        }

        let iterationAnimationTime = 0;
        for (const step of set.steps) {
            if (step.duration === undefined) {
                return step;
            }

            if (currentAnimationTime < iterationAnimationTime + step.duration) {
                return step;
            }

            iterationAnimationTime += step.duration;
        }

        return undefined;
    }

    private getSprite(set: ISpriteSet): ISprite | undefined | null {
        if (set.duration === undefined) {
            return this.getStaticSprite(set);
        }

        return this.getAnimationSprite(set, this.object.spawnTime);
    }

    private getSprites(): ISprite[] | undefined | null {
        if (this.sets === undefined || this.sets === null) {
            return this.sets;
        }

        return this.sets
            .map(set => this.getSprite(set))
            .filter(sprite => sprite !== undefined && sprite !== null) as ISprite[];
    }

    private updateSprites(): ISprite[] | undefined | null {
        if (this.sets === undefined || this.sets === null) {
            return this.sets;
        }

        this.sprites = this.getSprites();
        return this.sprites;
    }

    isSpritePass(sprite: ISprite, pass: number): boolean {
        return (sprite.renderPass === undefined && pass === 0)
        || (sprite.renderPass !== undefined && sprite.renderPass === pass);
    }

    update(): ISprite[] | undefined | null {
        this.updateSpriteSets();
        return this.updateSprites();
    }

    renderSprite(sprite: ISprite, objectRelativeX: number, objectRelativeY: number): void {
        if (sprite.image === undefined) {
            return;
        }

        let objectWidth;
        if (sprite.width === undefined) {
            objectWidth = this.object.properties.width;
        } else {
            objectWidth = sprite.width;
        }

        let objectHeight;
        if (sprite.height === undefined) {
            objectHeight = this.object.properties.height;
        } else {
            objectHeight = sprite.height;
        }

        if (sprite.offset !== undefined) {
            objectRelativeX += sprite.offset.x;
        }

        if (sprite.offset !== undefined) {
            objectRelativeY += sprite.offset.y;
        }

        this.context.drawImage(sprite.image, objectRelativeX,
            objectRelativeY, objectWidth, objectHeight);
    }

    renderPass(pass: number, canvasX: number, canvasY: number): boolean {
        if (!this.sprites) {
            return false;
        }

        const objectRelativeX = Math.floor(this.object.position.x) - canvasX;
        const objectRelativeY = Math.floor(this.object.position.y) - canvasY;
        this.sprites = this.sprites.filter(sprite => {
            if (!this.isSpritePass(sprite, pass)) {
                return true;
            }
    
            this.renderSprite(sprite, objectRelativeX, objectRelativeY);

            return false;
        });

        return this.sprites.length !== 0;
    }
}
