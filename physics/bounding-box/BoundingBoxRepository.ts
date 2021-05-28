import BoundingBox from './BoundingBox';
import BoundingBoxNode from '../bounding-box-tree/BoundingBoxNode';
import BoundingBoxTree from '../bounding-box-tree/BoundingBoxTree';
import LazyIterable from '@/utils/LazyIterable';
import BoundingBoxUtils from './BoundingBoxUtils';

export default class BoundingBoxRepository<V> {
    tree = new BoundingBoxTree<V>();
    map = new Map<V, BoundingBoxNode<V>>();

    constructor(
        private fatBoxFactor = 1,
    ) {}

    getBoxOverlappingValues(box: BoundingBox): Iterable<V> {
        return LazyIterable.from(this.tree.getOverlappingNodes(box))
            .map((node => {
                if (node.value === undefined) {
                    throw new Error('Overlapping node does not contain a value');
                }

                return node.value;
            }));
    }

    private getNode(value: V): BoundingBoxNode<V> {
        const node = this.map.get(value);
        if (!node) {
            throw new Error('Node does not exist for value');
        }

        return node;
    }

    private addNode(value: V, node: BoundingBoxNode<V>): void {
        this.tree.addNode(node);
        this.map.set(value, node);
    }

    getFatBox(box: BoundingBox): BoundingBox {
        return BoundingBoxUtils.grow(box, this.fatBoxFactor);
    }

    addBoxValue(value: V, box: BoundingBox): void {
        if (this.map.has(value)) {
            throw new Error('Node already exists with value');
        }

        const fatBox = this.getFatBox(box);
        const node = new BoundingBoxNode<V>(fatBox);
        node.value = value;
        node.realBox = box;
        this.addNode(value, node);
    }

    private _removeValue(value: V): BoundingBoxNode<V> {
        const node = this.getNode(value);
        this.tree.removeNode(node);
        return node;
    }

    removeValue(value: V): BoundingBoxNode<V> {
        const node = this._removeValue(value);
        this.map.delete(value);
        return node;
    }

    updateBoxValue(value: V, box: BoundingBox): void {
        const node = this.getNode(value);
        node.realBox = box;
        if (BoundingBoxUtils.contains(node.box, box)) {
            return;
        }

        this.tree.removeNode(node);
        node.box = this.getFatBox(box);
        this.addNode(value, node);
    }

    clear(): void {
        this.map.clear();
        this.tree.clearNodes();
    }
}
