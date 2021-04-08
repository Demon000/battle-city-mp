import IDrawable from '@/drawable/IDrawable';
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

    protected processDrawable(drawable: IDrawable): IDrawable {
        drawable = super.processDrawable(drawable);
        if (drawable.meta && drawable.meta.isTankDrawable) {
            drawable = drawable.color(this.object.color);
        }
        return drawable;
    }
}
