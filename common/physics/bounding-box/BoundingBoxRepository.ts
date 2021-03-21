import Bimap from '../../utils/Bimap';
import BoundingBox from './BoundingBox';
import BoundingBoxNode from '../bounding-box-tree/BoundingBoxNode';
import BoundingBoxTree from '../bounding-box-tree/BoundingBoxTree';

export default class BoundingBoxRepository {
    tree = new BoundingBoxTree();
    map = new Bimap<BoundingBoxNode, number>();

    getBoxOverlappingValues(box: BoundingBox): number[] {
        const nodes = this.tree.getOverlappingNodes(box);
        return nodes.map(n =>  this.map.getRight(n));
    }

    addBoxValue(value: number, box: BoundingBox): void {
        const node = new BoundingBoxNode(box);
        this.tree.addNode(node);
        this.map.add(node, value);
    }

    removeValue(value: number): void {
        try {
            const node = this.map.getLeft(value);
            this.tree.removeNode(node);
            this.map.removeLeft(node);
        } catch (err) {}
    }

    updateBoxValue(value: number, box: BoundingBox): void {
        this.removeValue(value);
        this.addBoxValue(value, box);
    }
}
