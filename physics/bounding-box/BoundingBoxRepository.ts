import BoundingBox from './BoundingBox';
import BoundingBoxNode from '../bounding-box-tree/BoundingBoxNode';
import BoundingBoxTree from '../bounding-box-tree/BoundingBoxTree';
import LazyIterable from '@/utils/LazyIterable';

export default class BoundingBoxRepository<V> {
    tree = new BoundingBoxTree<V>();
    map = new Map<V, BoundingBoxNode<V>>();

    getBoxOverlappingValues(box: BoundingBox): Iterable<V> {
        return LazyIterable.from(this.tree.getOverlappingNodes(box))
            .map((node => {
                if (node.value === undefined) {
                    throw new Error('Overlapping node does not contain a value');
                }

                return node.value;
            }));
    }

    addBoxValue(value: V, box: BoundingBox): void {
        if (this.map.has(value)) {
            throw new Error('Node already exists with value');
        }

        const node = new BoundingBoxNode<V>();
        node.box = box;
        node.value = value;
        this.tree.addNode(node);
        this.map.set(value, node);
    }

    removeValue(value: V): void {
        const node = this.map.get(value);
        if (!node) {
            throw new Error('Node does not exist for value');
        }

        this.tree.removeNode(node);
        this.map.delete(value);
    }

    updateBoxValue(value: V, box: BoundingBox): void {
        this.removeValue(value);
        this.addBoxValue(value, box);
    }

    clear(): void {
        this.map.clear();
        this.tree.clearNodes();
    }
}
