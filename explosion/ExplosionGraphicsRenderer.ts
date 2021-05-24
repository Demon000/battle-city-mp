import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import Explosion from './Explosion';

export default class ExplosionGraphicsRenderer extends GameObjectGraphicsRenderer<Explosion> {
    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (objectMeta.explosionType !== drawableMeta.explosionType) {
            return false;
        }

        return true;
    }
}
