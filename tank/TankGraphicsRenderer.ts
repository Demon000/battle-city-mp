import { DrawableType } from '@/drawable/DrawableType';
import IDrawable from '@/drawable/IDrawable';
import { IImageDrawable } from '@/drawable/IImageDrawable';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import Tank from './Tank';

export default class TankGraphicsRenderer extends GameObjectGraphicsRenderer<Tank> {
    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (!super.isDrawableMetaEqual(drawableMeta, objectMeta)) {
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
        if (drawable !== undefined && drawable.meta !== undefined && drawable.meta.isTankDrawable
            && (drawable.type === DrawableType.ANIMATED_IMAGE
                || drawable.type === DrawableType.IMAGE)) {
            drawable = (drawable as IImageDrawable).colorMask(this.object.color);
        }
        return drawable;
    }
}
