import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectSpriteMatcher from '../object/GameObjectSpriteMatcher';

export default class ExplosionSpriteMatcher extends GameObjectSpriteMatcher {
    isSpriteSetMetaEqual(setMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (objectMeta.explosionType !== setMeta.explosionType) {
            return false;
        }

        return true;
    }
}
