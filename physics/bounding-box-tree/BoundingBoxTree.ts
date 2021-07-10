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

        const left = down.children.left;
        const right = down.children.right;

        down.children.left = up;
        down.parent = up.parent;
        up.parent = down;

        const downParent = down.parent;
        if (downParent === undefined) {
            this.root = down;
        } else {
            const downParentChildren = downParent.children;
            assert(downParentChildren);
            downParent.childEqual(up,
                () => downParentChildren.left = down,
                () => downParentChildren.right = down,
            );
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

        const upChildren = up.children;
        assert(upChildren !== undefined);
        up.childEqual(down,
            () => upChildren.right = replaceOldDownNode,
            () => upChildren.left = replaceOldDownNode,
        );

        down.children.right = newDownRightNode;
        replaceOldDownNode.parent = up;

        up.recalculate();
        down.recalculate();
    }

    private balance(node: BoundingBoxNode<V>): BoundingBoxNode<V> {
        if (node.children === undefined || node.maxHeight < 4) {
            return node;
        }

        const balance = node.children.right.maxHeight - node.children.left.maxHeight;
        if (balance === 0) {
            return node;
        }

        let nodeToSwap;
        if (balance > 1) {
            nodeToSwap = node.children.right;
        } else if (balance < -1) {
            nodeToSwap = node.children.left;
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

            const leftCost = this.calculateBranchingCost(siblingNode.children.left,
                node.box) + minimumPushDownCost;
            const rightCost = this.calculateBranchingCost(siblingNode.children.right,
                node.box) + minimumPushDownCost;

            if (newParentNodeCost < leftCost && newParentNodeCost < rightCost) {
                break;
            }

            if (leftCost <= rightCost) {
                siblingNode = siblingNode.children.left;
            } else {
                siblingNode = siblingNode.children.right;
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
        node.parent = siblingNode.parent = newParentNode;

        if (oldParentNode === undefined) {
            this.root = newParentNode;
            return;
        }

        const oldParentNodeChildren = oldParentNode.children;
        assert(oldParentNodeChildren !== undefined);
        oldParentNode.childEqual(siblingNode,
            () => oldParentNodeChildren.left = newParentNode,
            () => oldParentNodeChildren.right = newParentNode,
        );

        this.fixTreeUpwards(oldParentNode);
    }

    removeNode(node: BoundingBoxNode<V>): void {
        if (!node.parent) {
            this.root = undefined;
            return;
        }

        const parentNode = node.parent;
        const grandParentNode = node.parent.parent;

        let siblingNode: BoundingBoxNode<V> | undefined;
        const parentNodeChildren = parentNode.children;
        assert(parentNodeChildren);
        parentNode.childEqual(node,
            () => siblingNode = parentNodeChildren.right,
            () => siblingNode = parentNodeChildren.left,
        );

        assert(siblingNode !== undefined);

        if (grandParentNode === undefined) {
            this.root = siblingNode;
        } else {
            if (grandParentNode.left === parentNode) {
                grandParentNode.left = siblingNode;
            } else if (grandParentNode.right === parentNode) {
                grandParentNode.right = siblingNode;
            } else {
                throw new Error('Grand parent of node being removed is inconsistent');
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
