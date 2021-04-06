import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';

export default class ExplosionGraphicsRenderer extends GameObjectGraphicsRenderer {
    isSpriteSetMetaEqual(setMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (objectMeta.explosionType !== setMeta.explosionType) {
            return false;
        }

        return true;
    }
}
