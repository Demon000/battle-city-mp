import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';

export default class TankGraphicsRenderer extends GameObjectGraphicsRenderer {
    isSpriteSetMetaEqual(setMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (setMeta.isMoving !== undefined && objectMeta.isMoving !== setMeta.isMoving) {
            return false;
        }

        if (setMeta.tier !== undefined && objectMeta.tier !== setMeta.tier) {
            return false;
        }

        return true;
    }
}
