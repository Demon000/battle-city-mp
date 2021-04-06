import GameObject from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';
import { ISprite, ISpriteSet, ISpriteSetPositionMatching, ResourceMeta } from '@/object/IGameObjectProperties';
import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export default class GameObjectGraphicsRenderer {
    object: GameObject;
    sets: ISpriteSet[] | undefined = [];

    constructor(object: GameObject) {
        this.object = object;
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

    private findSpriteSet(type: GameObjectType, meta: ResourceMeta): ISpriteSet | undefined | null {
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

    private isMetasMatchingSpriteSets(metas: ResourceMeta[]): boolean {
        if (metas === undefined || this.sets === undefined) {
            return false;
        }

        if (metas.length !== this.sets.length) {
            return false;
        }

        for (let i = 0; i < metas.length; i++) {
            if (!this.isSpriteSetMatchingMeta(this.sets[i], metas[i])) {
                return false;
            }
        }

        return true;
    }

    private updateSpriteSets(metas: ResourceMeta[]): boolean {
        this.sets = [];
        let hasAnySprite = false;

        for (const meta of metas) {
            const set = this.findSpriteSet(this.object.type, meta);
            if (set !== undefined && set !== null) {
                this.sets.push(set);
            }

            if (set !== undefined) {
                hasAnySprite = true;
            }
        }

        return hasAnySprite;
    }

    private getSprites(): ISprite[] {
        if (this.sets === undefined) {
            throw new Error('Inconsistent sprite sets');
        }

        return this.sets
            .map(set => this.getSprite(set))
            .filter(sprite => sprite !== undefined && sprite !== null) as ISprite[];
    }

    get sprites(): ISprite[] | undefined {
        if (this.sets === undefined) {
            return;
        }

        const metas = this.object.graphicsMeta;
        if (!this.isMetasMatchingSpriteSets(metas)) {
            const hasAnySprite = this.updateSpriteSets(metas);
            if (!hasAnySprite) {
                this.sets = undefined;
                return;
            }
        }
    
        return this.getSprites();
    }
}
