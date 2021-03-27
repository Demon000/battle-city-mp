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
                throw new Error('Parent of node being rotated is inconsistent with parent children');
            }
        }

        let newDownRightNode;
        let replaceOldDownNode;
        if (left.height > right.height) {
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
            throw new Error('Parent of node being rotated is inconsistent with parent children');
        }

        down.right = newDownRightNode;
        replaceOldDownNode.parent = up;

        up.recalculateBox();
        up.recalculateHeight();
        down.recalculateBox();
        down.recalculateHeight();
    }

    private balance(node: BoundingBoxNode<V>): BoundingBoxNode<V> {
        if (node.left === undefined || node.right === undefined || node.height < 3) {
            return node;
        }

        const balance = node.right.height - node.left.height;
        if (balance === 0) {
            return node;
        }

        const nodeToSwap = balance > 1 ? node.right : node.left;
        this.swapNodeUp(node, nodeToSwap);
        return nodeToSwap;
    }

    fixTreeUpwards(node?: BoundingBoxNode<V>): void {
        while (node !== undefined) {
            node = this.balance(node);

            if (node.left !== undefined || node.right !== undefined) {
                node.recalculateHeight();
                node.recalculateBox();
            }

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
            throw new Error('Parent of node being pushed down is inconsistent with parent children');
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
        const siblingNode = parentNode.left === node ? parentNode.right : parentNode.left;

        if (siblingNode === undefined) {
            throw new Error('Tree node does not have a sibling');
        }

        if (grandParentNode === undefined) {
            this.root = siblingNode;
            siblingNode.parent = undefined;
        } else {
            if (grandParentNode.left === parentNode) {
                grandParentNode.left = siblingNode;
            } else if (grandParentNode.right === parentNode) {
                grandParentNode.right = siblingNode;
            } else {
                throw new Error('Grand parent of node being removed is inconsistent with grand parent children');
            }
            siblingNode.parent = grandParentNode;
            this.fixTreeUpwards(grandParentNode);
        }
    }

    getOverlappingNodes(box: BoundingBox): BoundingBoxNode<V>[] {
        const nodes: BoundingBoxNode<V>[] = [];
        const stack: BoundingBoxNode<V>[] = [];
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
