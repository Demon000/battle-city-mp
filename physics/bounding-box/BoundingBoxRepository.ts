import { BoundingBox } from './BoundingBox';
import { BoundingBoxNode } from '../bounding-box-tree/BoundingBoxNode';
import { BoundingBoxTree } from '../bounding-box-tree/BoundingBoxTree';
import { assert } from '@/utils/assert';

export class BoundingBoxRepository<V> {
    tree = new BoundingBoxTree<V>();
    map = new Map<V, BoundingBoxNode<V>>();

    getBoxOverlappingValues(box: BoundingBox): Iterable<V> {
        return this.tree.getOverlappingNodeValues(box);
    }

    hasNode(value: V): boolean {
        return this.map.has(value);
    }

    findNode(value: V): BoundingBoxNode<V> | undefined {
        return this.map.get(value);
    }

    private getNode(value: V): BoundingBoxNode<V> {
        const node = this.findNode(value);
        assert(node !== undefined, `Node does not exist for value '${value}'`);
        return node;
    }

    private addNode(value: V, node: BoundingBoxNode<V>): void {
        this.tree.addNode(node);
        this.map.set(value, node);
    }

    addBoxValue(value: V, realBox: BoundingBox, fatGrowFactor = 0): void {
        assert(!this.map.has(value),
            `Node already exists with value '${value}'`);

        const node = new BoundingBoxNode<V>({
            realBox,
            fatGrowFactor,
            value,
        });
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
        this.tree.removeNode(node);
        node.recalculateFatBox();
        this.addNode(value, node);
    }

    clear(): void {
        this.map.clear();
        this.tree.clearNodes();
    }
}
