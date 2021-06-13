import { GameObjectAudioRenderer } from '@/object/GameObjectAudioRenderer';
import { ResourceMeta } from '@/object/IGameObjectProperties';

export class TankAudioRenderer extends GameObjectAudioRenderer {
    isAudioEffectMetaEqual(audioEffectMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (audioEffectMeta.isMoving !== undefined && objectMeta.isMoving !== audioEffectMeta.isMoving) {
            return false;
        }

        return true;
    }
}
