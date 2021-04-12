import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import Bullet from './Bullet';

export default class BulletGraphicsRenderer extends GameObjectGraphicsRenderer<Bullet> {
    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (!super.isDrawableMetaEqual(drawableMeta, objectMeta)) {
            return false;
        }

        if (drawableMeta.power !== undefined && objectMeta.power !== drawableMeta.power) {
            return false;
        }

        return true;
    }
}
