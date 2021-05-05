import GameObject from '@/object/GameObject';
import { ResourceMeta } from '@/object/IGameObjectProperties';

export default class BrickWall extends GameObject {
    get graphicsMeta(): ResourceMeta[] | undefined | null {
        return [{
            position: this.position,
        }];
    }
}
