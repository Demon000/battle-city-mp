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

    private addNode(value: V, node: BoundingBoxNode<V>): void {
        this.tree.addNode(node);
        this.map.set(value, node);
    }

    addBoxValue(value: V, box: BoundingBox): void {
        if (this.map.has(value)) {
            throw new Error('Node already exists with value');
        }

        const node = new BoundingBoxNode<V>(box);
        node.value = value;
        this.addNode(value, node);
    }

    private removeNode(value: V): BoundingBoxNode<V> {
        const node = this.map.get(value);
        if (!node) {
            throw new Error('Node does not exist for value');
        }

        this.tree.removeNode(node);
        return node;
    }

    removeValue(value: V): BoundingBoxNode<V> {
        const node =this.removeNode(value);
        this.map.delete(value);
        return node;
    }

    updateBoxValue(value: V, box: BoundingBox): void {
        const node = this.removeNode(value);
        node.box = box;
        this.addNode(value, node);
    }

    clear(): void {
        this.map.clear();
        this.tree.clearNodes();
    }
}
