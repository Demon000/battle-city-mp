import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';

export default class ExplosionGraphicsRenderer extends GameObjectGraphicsRenderer {
    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (objectMeta.explosionType !== drawableMeta.explosionType) {
            return false;
        }

        return true;
    }
}
