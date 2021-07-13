import { BoundingBox } from '../bounding-box/BoundingBox';
import { BoundingBoxNode } from './BoundingBoxNode';
import { BoundingBoxUtils } from '../bounding-box/BoundingBoxUtils';
import { BoundingBoxTreeIterator } from './BoundingBoxTreeIterator';
import { assert } from '@/utils/assert';

export class BoundingBoxTree<V> {
    root?: BoundingBoxNode<V>;

    calculateBranchingCost(node: BoundingBoxNode<V>, box: BoundingBox): number {
        const newNodeBox = BoundingBoxUtils.combine(box, node.box);
        let cost = BoundingBoxUtils.volume(newNodeBox);
        if (node.children !== undefined) {
            cost -= BoundingBoxUtils.volume(node.box);
        }
        return cost;
    }

    private swapNodeUp(up: BoundingBoxNode<V>, down: BoundingBoxNode<V>) {
        assert(down.children !== undefined);

        const left = down.left;
        const right = down.right;

        down.left = up;
        down.parent = up.parent;
        up.parent = down;

        if (down.parent === undefined) {
            this.root = down;
        } else {
            if (down.parent.left === up) {
                down.parent.left = down;
            } else if (down.parent.right === up) {
                down.parent.right = down;
            } else {
                assert(false);
            }
        }

        let newDownRightNode: BoundingBoxNode<V>;
        let replaceOldDownNode: BoundingBoxNode<V>;
        if (left.maxHeight > right.maxHeight) {
            newDownRightNode = left;
            replaceOldDownNode = right;
        } else {
            newDownRightNode = right;
            replaceOldDownNode = left;
        }

        if (up.right === down) {
            up.right = replaceOldDownNode;
        } else if (up.left === down) {
            up.left = replaceOldDownNode;
        } else {
            assert(false);
        }

        down.right = newDownRightNode;
        replaceOldDownNode.parent = up;

        up.recalculate();
        down.recalculate();
    }

    private balance(node: BoundingBoxNode<V>): BoundingBoxNode<V> {
        if (node.children === undefined || node.maxHeight < 4) {
            return node;
        }

        const balance = node.right.maxHeight - node.left.maxHeight;
        if (balance === 0) {
            return node;
        }

        let nodeToSwap;
        if (balance > 1) {
            nodeToSwap = node.right;
        } else if (balance < -1) {
            nodeToSwap = node.left;
        }

        if (nodeToSwap !== undefined) {
            this.swapNodeUp(node, nodeToSwap);
            return nodeToSwap;
        }

        return node;
    }

    fixTreeUpwards(node?: BoundingBoxNode<V>): void {
        while (node !== undefined) {
            node.recalculate(true);

            node = this.balance(node);
            node = node.parent;
        }
    }

    addNode(node: BoundingBoxNode<V>): void {
        if (this.root === undefined) {
            this.root = node;
            return;
        }

        let siblingNode = this.root;
        while (siblingNode.children !== undefined) {
            const currentNodeVolume = BoundingBoxUtils.volume(siblingNode.box);

            const newParentNodeBox = BoundingBoxUtils.combine(siblingNode.box, node.box);
            const newParentNodeVolume = BoundingBoxUtils.volume(newParentNodeBox);
            const newParentNodeCost = 2 * newParentNodeVolume;

            const minimumPushDownCost = newParentNodeCost - 2 * currentNodeVolume;

            const leftCost = this.calculateBranchingCost(siblingNode.left,
                node.box) + minimumPushDownCost;
            const rightCost = this.calculateBranchingCost(siblingNode.right,
                node.box) + minimumPushDownCost;

            if (newParentNodeCost < leftCost && newParentNodeCost < rightCost) {
                break;
            }

            if (leftCost <= rightCost) {
                siblingNode = siblingNode.left;
            } else {
                siblingNode = siblingNode.right;
            }
        }

        const oldParentNode = siblingNode.parent;
        const newParentNode = new BoundingBoxNode({
            parent: oldParentNode,
            children: {
                left: node,
                right: siblingNode,
            },
        });

        if (oldParentNode === undefined) {
            this.root = newParentNode;
            return;
        }

        if (oldParentNode.left === siblingNode) {
            oldParentNode.left = newParentNode;
        } else if (oldParentNode.right === siblingNode) {
            oldParentNode.right = newParentNode;
        } else {
            assert(false);
        }

        this.fixTreeUpwards(oldParentNode);
    }

    removeNode(node: BoundingBoxNode<V>): void {
        if (!node.parent) {
            this.root = undefined;
            return;
        }

        const parentNode = node.parent;
        const grandParentNode = node.parent.parent;

        let siblingNode;
        if (parentNode.left === node) {
            siblingNode = parentNode.right;
        } else if (parentNode.right === node) {
            siblingNode = parentNode.left;
        } else {
            assert(false);
        }

        if (grandParentNode === undefined) {
            this.root = siblingNode;
        } else {
            if (grandParentNode.left === parentNode) {
                grandParentNode.left = siblingNode;
            } else if (grandParentNode.right === parentNode) {
                grandParentNode.right = siblingNode;
            } else {
                assert(false);
            }
        }

        siblingNode.parent = grandParentNode;
        this.fixTreeUpwards(grandParentNode);
    }

    getOverlappingNodeValues(box: BoundingBox): Iterable<V> {
        const root = this.root;
        return {
            [Symbol.iterator]() {
                return new BoundingBoxTreeIterator(box, root);
            },
        };
    }

    clearNodes(): void {
        this.root = undefined;
    }
}
