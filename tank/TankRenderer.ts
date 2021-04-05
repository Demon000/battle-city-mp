import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectRenderer from '../object/GameObjectRenderer';

export class TankRenderer extends GameObjectRenderer {
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
