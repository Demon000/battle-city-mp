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
        left?: BoundingBoxNode<V>,
        right?: BoundingBoxNode<V>,
        parent?: BoundingBoxNode<V>,
        height = 1,
    ) {
        this.box = box;
        this.left = left;
        this.right = right;
        this.parent = parent;
        this.height = height;
    }

    static fromChildren<V>(
        left: BoundingBoxNode<V>,
        right: BoundingBoxNode<V>,
        oldParentNode: BoundingBoxNode<V> | undefined,
    ): BoundingBoxNode<V> {
        const box = BoundingBoxUtils.combine(left.box, right.box);
        const node = new BoundingBoxNode<V>(box, left, right, oldParentNode);
        node.recalculateHeight();
        return node;
    }

    recalculateHeight(): void {
        this.height = 1 + Math.max(this.left?.height ?? 0, this.right?.height ?? 0);
    }

    recalculateBox(): void {
        if (this.left === undefined || this.right === undefined) {
            throw new Error('Cannot fix box of leaf node');
        }

        this.box = BoundingBoxUtils.combine(this.left.box, this.right.box);
    }
}
