import { GameObjectAudioRenderer } from '@/object/GameObjectAudioRenderer';
import { ResourceMeta } from '@/object/GameObjectProperties';

export class TankAudioRenderer extends GameObjectAudioRenderer {
    isAudioEffectMetaEqual(audioEffectMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (audioEffectMeta.isMoving !== undefined && objectMeta.isMoving !== audioEffectMeta.isMoving) {
            return false;
        }

        return true;
    }
}
