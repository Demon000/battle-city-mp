import BoundingBox from '../bounding-box/BoundingBox';
import BoundingBoxNode from './BoundingBoxNode';
import Utils from '../bounding-box/BoundingBoxUtils';

export default class BoundingBoxTree<V> {
    root?: BoundingBoxNode<V>;

    calculateBranchingCost(node: BoundingBoxNode<V>, box: BoundingBox): number {
        const newNodeBox = Utils.combine(box, node.box);
        let cost = Utils.volume(newNodeBox);
        if (node.left !== undefined && node.right !== undefined) {
            cost -= Utils.volume(node.box);
        }
        return cost;
    }

    private swapNodeUp(up: BoundingBoxNode<V>, down: BoundingBoxNode<V>) {
        const left = down.left;
        const right = down.right;

        if (left === undefined || right === undefined) {
            throw new Error('Height of node being balanced is inconsistent with structure');
        }

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
                throw new Error('Parent of node being rotated is inconsistent');
            }
        }

        let newDownRightNode;
        let replaceOldDownNode;
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
            throw new Error('Parent of node being rotated is inconsistent');
        }

        down.right = newDownRightNode;
        replaceOldDownNode.parent = up;

        up.recalculate();
        down.recalculate();
    }

    private balance(node: BoundingBoxNode<V>): BoundingBoxNode<V> {
        if (node.left === undefined || node.right === undefined || node.maxHeight < 4) {
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
            if (node.left !== undefined && node.right !== undefined) {
                node.recalculateHeight();
                node.recalculateBox();
            }

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
        while (siblingNode.left !== undefined && siblingNode.right !== undefined) {
            const currentNodeVolume = Utils.volume(siblingNode.box);

            const newParentNodeBox = Utils.combine(siblingNode.box, node.box);
            const newParentNodeVolume = Utils.volume(newParentNodeBox);
            const newParentNodeCost = 2 * newParentNodeVolume;

            const minimumPushDownCost = newParentNodeCost - 2 * currentNodeVolume;

            const leftCost = this.calculateBranchingCost(siblingNode.left, node.box) + minimumPushDownCost;
            const rightCost = this.calculateBranchingCost(siblingNode.right, node.box) + minimumPushDownCost;

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
        const newParentNode = BoundingBoxNode.fromChildren(node, siblingNode, oldParentNode);
        node.parent = siblingNode.parent = newParentNode;

        if (oldParentNode === undefined) {
            this.root = newParentNode;
            return;
        }

        if (oldParentNode.left === siblingNode) {
            oldParentNode.left = newParentNode;
        } else if (oldParentNode.right === siblingNode) {
            oldParentNode.right = newParentNode;
        } else {
            throw new Error('Parent of node being pushed down is inconsistent');
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
            throw new Error('Parent of node being removed is inconsistent');
        }

        if (siblingNode === undefined) {
            throw new Error('Tree node does not have a sibling');
        }

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

    getOverlappingNodes(box: BoundingBox): BoundingBoxNode<V>[] {
        const nodes = new Array<BoundingBoxNode<V>>();
        const stack = new Array<BoundingBoxNode<V>>();
        let i = 0;

        if (this.root === undefined) {
            return stack;
        }

        stack.push(this.root);

        while (stack[i]) {
            const node = stack[i];

            if (Utils.overlaps(node.box, box)) {
                if (node.left === undefined || node.right === undefined) {
                    nodes.push(node);
                } else {
                    stack.push(node.left);
                    stack.push(node.right);
                }
            }

            i++;
        }

        return nodes;
    }
}
