import BoundingBox from './BoundingBox';
import BoundingBoxNode from '../bounding-box-tree/BoundingBoxNode';
import BoundingBoxTree from '../bounding-box-tree/BoundingBoxTree';
import BoundingBoxUtils from './BoundingBoxUtils';

export default class BoundingBoxRepository<V> {
    list = new Array<BoundingBoxNode<V>>();
    tree = new BoundingBoxTree<V>();
    map = new Map<V, BoundingBoxNode<V>>();

    getBoxOverlappingValues(box: BoundingBox): V[] {
        return this.list.filter(n => {
            if (BoundingBoxUtils.overlaps(n.box, box)) {
                return true;
            }

            return false;
        }).map(n => {
            if (n.value === undefined) {
                throw new Error('Overlapping node does not contain a value');
            }

            return n.value;
        });
        // const nodes = this.tree.getOverlappingNodes(box);
        // return nodes.map(n =>  {
        //     if (n.value === undefined) {
        //         throw new Error('Overlapping node does not contain a value');
        //     }

        //     return n.value;
        // });
    }

    addBoxValue(value: V, box: BoundingBox): void {
        if (this.map.has(value)) {
            throw new Error('Node already exists with value');
        }

        const node = new BoundingBoxNode<V>(box);
        node.value = value;
        this.list.push(node);
        // this.tree.addNode(node);
        this.map.set(value, node);
    }

    removeValue(value: V): void {
        const node = this.map.get(value);
        if (!node) {
            throw new Error('Node does not exist for value');
        }

        const index = this.list.findIndex(n => {
            if (n.value === value) {
                return true;
            }

            return false;
        });

        if (index === -1) {
            throw new Error('Node does not exist for value');
        }

        this.list.splice(index, 1);

        // this.tree.removeNode(node);
        this.map.delete(value);
    }

    updateBoxValue(value: V, box: BoundingBox): void {
        this.removeValue(value);
        this.addBoxValue(value, box);
    }
}
