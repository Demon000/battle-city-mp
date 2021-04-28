import BoundingBoxNode from './BoundingBoxNode';
import BoundingBoxUtils from '../bounding-box/BoundingBoxUtils';
import BoundingBox from '../bounding-box/BoundingBox';

export class BoundingBoxTreeIterator<V> implements Iterator<BoundingBoxNode<V>> {
    private box: BoundingBox;
    private nodes: BoundingBoxNode<V>[];

    private stack = new Array<number>();
    private i = 0;

    constructor(box: BoundingBox, nodeIndex: number | undefined, nodes: BoundingBoxNode<V>[]) {
        this.box = box;
        this.nodes = nodes;

        if (nodeIndex !== undefined) {
            this.stack.push(nodeIndex);
        }
    }

    next(): IteratorResult<BoundingBoxNode<V>, undefined> {
        let foundNode;
        let nodeIndex;

        while ((nodeIndex = this.stack[this.i]) !== undefined) {
            const node = this.nodes[nodeIndex];
            if (node !== undefined &&
                BoundingBoxUtils.overlaps(node.box, this.box)) {
                if (node.leftIndex === undefined
                    || node.rightIndex === undefined) {
                    foundNode = node;
                } else {
                    this.stack.push(node.leftIndex);
                    this.stack.push(node.rightIndex);
                }
            }

            this.i++;

            if (foundNode !== undefined) {
                break;
            }
        }

        if (foundNode === undefined) {
            return {
                done: true,
                value: undefined,
            };
        } else {
            return {
                done: false,
                value: foundNode,
            };
        }
    }
}
