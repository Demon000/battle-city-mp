import GameObject from '@/object/GameObject';
import { ResourceMeta } from '@/object/IGameObjectProperties';

export default class Grass extends GameObject {
    get graphicsMeta(): ResourceMeta[] | undefined | null {
        return [{
            position: this.position,
        }];
    }
}
