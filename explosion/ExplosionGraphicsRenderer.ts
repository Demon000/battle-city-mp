import { ResourceMeta } from '@/object/IGameObjectProperties';
import GameObjectGraphicsRenderer from '../object/GameObjectGraphicsRenderer';
import Explosion from './Explosion';

export default class ExplosionGraphicsRenderer extends GameObjectGraphicsRenderer<Explosion> {
    updateMeshPosition(): void {
        if (this.mesh === undefined) {
            return;
        }

        super.updateMeshPosition();
        this.mesh.position.x = -this.object.position.x;
        this.mesh.position.z = this.object.position.y;
    }

    isDrawableMetaEqual(drawableMeta: ResourceMeta, objectMeta: ResourceMeta): boolean {
        if (objectMeta.explosionType !== drawableMeta.explosionType) {
            return false;
        }

        return true;
    }
}
