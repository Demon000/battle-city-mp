import BoundingBox from '../bounding-box/BoundingBox';

export default class BoundingBoxNode {
    box: BoundingBox;
    parent?: BoundingBoxNode;
    left?: BoundingBoxNode;
    right?: BoundingBoxNode;

    constructor(box: BoundingBox, parent?: BoundingBoxNode, left?: BoundingBoxNode, right?: BoundingBoxNode) {
        this.box = box;
        this.parent = parent;
        this.left = left;
        this.right = right;
    }

    get isLeaf(): boolean {
        return !this.left && !this.right;
    }
}
