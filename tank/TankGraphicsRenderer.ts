import { DrawableType } from '@/drawable/DrawableType';
import IDrawable from '@/drawable/IDrawable';
import { IImageDrawable } from '@/drawable/IImageDrawable';
import TextDrawable, { TextPositionReference } from '@/drawable/TextDrawable';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import { Direction } from '@/physics/Direction';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import Tank from './Tank';

export default class TankGraphicsRenderer extends GameObjectGraphicsRenderer<Tank> {
    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (!super.isDrawableMetaEqual(drawableMeta, objectMeta)) {
            return false;
        }

        if (drawableMeta.isTank !== objectMeta.isTank
            || drawableMeta.isText !== objectMeta.isText) {
            return false;
        }

        if (drawableMeta.isMoving !== undefined && objectMeta.isMoving !== drawableMeta.isMoving) {
            return false;
        }

        if (drawableMeta.tier !== undefined && objectMeta.tier !== drawableMeta.tier) {
            return false;
        }

        return true;
    }

    protected processDrawable(drawable: IDrawable | undefined): IDrawable | undefined {
        drawable = super.processDrawable(drawable);
        if (drawable === undefined || drawable.meta === undefined) {
            return drawable;
        }

        if (drawable.meta.isTank && (drawable.type === DrawableType.ANIMATED_IMAGE
            || drawable.type === DrawableType.IMAGE)) {
            drawable = (drawable as IImageDrawable).colorMask(this.object.color);
        } else if (drawable.meta.isText) {
            drawable = (drawable as TextDrawable).withText(this.object.playerName);
            if (drawable === undefined) {
                return drawable;
            }

            const position = this.object.position;
            const centerPosition = this.object.centerPosition;
            const direction = this.object.direction;
            const offsetX = centerPosition.x - position.x;
            let offsetY = 0;
            let positionYReference: TextPositionReference | undefined = 'end';
            if (direction === Direction.UP) {
                offsetY = this.object.properties.height;
                positionYReference = undefined;
            }

            if (positionYReference !== undefined) {
                drawable = (drawable as TextDrawable).positionYReference(positionYReference);
            }

            if (drawable === undefined) {
                return drawable;
            }

            drawable = drawable.offset(offsetX, offsetY);
        }

        return drawable;
    }
}
