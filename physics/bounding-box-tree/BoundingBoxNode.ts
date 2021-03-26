import BoundingBox from '../bounding-box/BoundingBox';
import BoundingBoxUtils from '../bounding-box/BoundingBoxUtils';

export default class BoundingBoxNode<V> {
    box: BoundingBox;
    parent?: BoundingBoxNode<V>;
    left?: BoundingBoxNode<V>;
    right?: BoundingBoxNode<V>;
    value?: V;
    height: number;

    constructor(
        box: BoundingBox,
        parent?: BoundingBoxNode<V>,
        left?: BoundingBoxNode<V>,
        right?: BoundingBoxNode<V>,
        height = 1,
    ) {
        this.box = box;
        this.parent = parent;
        this.left = left;
        this.right = right;
        this.height = height;
    }

    static fromChildren<V>(
        left: BoundingBoxNode<V>,
        right: BoundingBoxNode<V>,
        oldParentNode: BoundingBoxNode<V> | undefined,
    ): BoundingBoxNode<V> {
        const box = BoundingBoxUtils.combine(left.box, right.box);
        const node = new BoundingBoxNode(box, left, right, oldParentNode);
        node.fixHeight();
        return node;
    }

    fixHeight(): void {
        this.height = 1 + Math.max(this.left?.height ?? 0, this.right?.height ?? 0);
    }

    fixBox(): void {
        if (this.left === undefined || this.right === undefined) {
            throw new Error('Cannot fix box of leaf node');
        }

        this.box = BoundingBoxUtils.combine(this.left.box, this.right.box);
    }
}
