import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectRenderer from '../object/GameObjectRenderer';

export default class ExplosionRenderer extends GameObjectRenderer {
    isSpriteSetMetaEqual(setMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (objectMeta.explosionType !== setMeta.explosionType) {
            return false;
        }

        return true;
    }
}
