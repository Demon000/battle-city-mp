import { BoundingBox } from './BoundingBox';
import { BoundingBoxNode } from '../bounding-box-tree/BoundingBoxNode';
import { BoundingBoxTree } from '../bounding-box-tree/BoundingBoxTree';
import { Config } from '@/config/Config';

export class BoundingBoxRepository<V> {
    tree = new BoundingBoxTree<V>();
    map = new Map<V, BoundingBoxNode<V>>();

    constructor(
        private config: Config,
    ) {}

    getBoxOverlappingValues(box: BoundingBox): Iterable<V> {
        return this.tree.getOverlappingNodeValues(box);
    }

    private getNode(value: V): BoundingBoxNode<V> {
        const node = this.map.get(value);
        if (!node) {
            throw new Error(`Node does not exist for value: ${value}`);
        }

        return node;
    }

    private addNode(value: V, node: BoundingBoxNode<V>): void {
        this.tree.addNode(node);
        this.map.set(value, node);
    }

    addBoxValue(value: V, box: BoundingBox): void {
        if (this.map.has(value)) {
            throw new Error(`Node already exists with value: ${value}`);
        }

        const node = new BoundingBoxNode<V>({
            fatGrowFactor: this.config.get('bounding-box', 'fatGrowFactor'),
            realBox: box,
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

        if (node.isFatBoxFitting()) {
            return;
        }

        this.tree.removeNode(node);
        node.recalculateFatBox();
        this.addNode(value, node);
    }

    clear(): void {
        this.map.clear();
        this.tree.clearNodes();
    }
}
