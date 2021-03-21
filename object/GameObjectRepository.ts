import Bimap from '@/utils/Bimap';
import GameObject from './GameObject';

export default class GameObjectRepository {
    private map = new Bimap<number, GameObject>();

    get(objectId: number): GameObject {
        return this.map.getRight(objectId);
    }

    getMultiple(objectIds: number[]): GameObject[] {
        const objects = new Array<GameObject>();
        for (const objectId of objectIds) {
            objects.push(this.map.getRight(objectId));
        }
        return objects;
    }

    getAll(): GameObject[] {
        return this.map.getAllRight();
    }

    add(object: GameObject): void {
        this.map.add(object.id, object);
    }

    remove(objectId: number): void {
        this.map.removeLeft(objectId);
    }
}
