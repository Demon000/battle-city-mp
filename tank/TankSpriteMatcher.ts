import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectSpriteMatcher from '../object/GameObjectSpriteMatcher';

export class TankSpriteMatcher extends GameObjectSpriteMatcher {
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
