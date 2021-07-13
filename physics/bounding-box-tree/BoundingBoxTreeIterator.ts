import { BoundingBoxNode } from './BoundingBoxNode';
import { BoundingBoxUtils } from '../bounding-box/BoundingBoxUtils';
import { BoundingBox } from '../bounding-box/BoundingBox';
import { assert } from '@/utils/assert';

export class BoundingBoxTreeIterator<V> implements Iterator<V> {
    private box: BoundingBox;

    private stack = new Array<BoundingBoxNode<V>>();
    private i = 0;

    constructor(box: BoundingBox, node: BoundingBoxNode<V> | undefined) {
        this.box = box;

        if (node !== undefined) {
            this.stack.push(node);
        }
    }

    next(): IteratorResult<V, undefined> {
        let foundNode = undefined;

        while (foundNode === undefined && this.stack[this.i] !== undefined) {
            const node = this.stack[this.i++];

            if (!BoundingBoxUtils.overlaps(node.box, this.box)) {
                continue;
            }

            if (node.fatBox !== undefined
                && node.realBox !== undefined
                && !BoundingBoxUtils.overlaps(node.realBox, this.box)) {
                continue;
            }

            if (node.children === undefined) {
                foundNode = node;
            } else {
                this.stack.push(node.children.left);
                this.stack.push(node.children.right);
            }
        }

        if (foundNode === undefined) {
            return {
                done: true,
                value: undefined,
            };
        } else {
            assert(foundNode.value !== undefined);

            return {
                done: false,
                value: foundNode.value,
            };
        }
    }
}
