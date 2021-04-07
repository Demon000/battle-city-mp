import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';

export default class TankGraphicsRenderer extends GameObjectGraphicsRenderer {
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
}
