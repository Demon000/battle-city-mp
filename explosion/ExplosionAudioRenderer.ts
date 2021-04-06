import GameObjectAudioRenderer from '@/object/GameObjectAudioRenderer';
import { ResourceMeta } from '@/object/IGameObjectProperties';

export default class ExplosionAudioRenderer extends GameObjectAudioRenderer {
    isAudioEffectMetaEqual(audioEffectMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (audioEffectMeta.destroyedObjectType !== undefined
            && objectMeta.destroyedObjectType !== audioEffectMeta.destroyedObjectType) {
            return false;
        }

        return true;
    }
}
