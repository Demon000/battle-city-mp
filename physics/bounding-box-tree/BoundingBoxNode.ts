import BoundingBox from '../bounding-box/BoundingBox';

export default class BoundingBoxNode<V> {
    box: BoundingBox;
    parent?: BoundingBoxNode<V>;
    left?: BoundingBoxNode<V>;
    right?: BoundingBoxNode<V>;
    value?: V;

    constructor(
        box: BoundingBox,
        parent?: BoundingBoxNode<V>,
        left?: BoundingBoxNode<V>,
        right?: BoundingBoxNode<V>,
    ) {
        this.box = box;
        this.parent = parent;
        this.left = left;
        this.right = right;
    }

    get isLeaf(): boolean {
        return !this.left && !this.right;
    }
}
