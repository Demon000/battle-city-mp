import BoundingBoxNode from './BoundingBoxNode';
import BoundingBoxUtils from '../bounding-box/BoundingBoxUtils';
import BoundingBox from '../bounding-box/BoundingBox';

export class BoundingBoxTreeIterator<V> implements Iterator<BoundingBoxNode<V>> {
    private box: BoundingBox;

    private stack = new Array<BoundingBoxNode<V>>();
    private i = 0;

    constructor(box: BoundingBox, node: BoundingBoxNode<V> | undefined) {
        this.box = box;

        if (node !== undefined) {
            this.stack.push(node);
        }
    }

    next(): IteratorResult<BoundingBoxNode<V>, undefined> {
        let foundNode = undefined;

        while (this.stack[this.i] !== undefined) {
            const node = this.stack[this.i];

            if (BoundingBoxUtils.overlaps(node.box, this.box)) {
                if (node.left === undefined || node.right === undefined) {
                    foundNode = node;
                } else {
                    this.stack.push(node.left);
                    this.stack.push(node.right);
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
