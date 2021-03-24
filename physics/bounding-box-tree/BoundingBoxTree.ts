import BoundingBox from '../bounding-box/BoundingBox';
import BoundingBoxNode from './BoundingBoxNode';
import Utils from '../bounding-box/BoundingBoxUtils';

export default class BoundingBoxTree<V> {
    root?: BoundingBoxNode<V>;

    calculateBranchingCost(node: BoundingBoxNode<V>, box: BoundingBox): number {
        const newLeftNodeBox = Utils.combine(box, node.box);
        let cost = Utils.volume(newLeftNodeBox);
        if (!node.isLeaf) {
            cost -= Utils.volume(node.box);
        }
        return cost;
    }

    fixTreeUpwards(newParentNode?: BoundingBoxNode<V>): void {
        while (newParentNode != undefined) {
            if (!newParentNode.left || !newParentNode.right) {
                throw new Error('Tree node is missing children');
            }

            newParentNode.box = Utils.combine(newParentNode.left.box, newParentNode.right.box);
            newParentNode = newParentNode.parent;
        }
    }

    addNode(node: BoundingBoxNode<V>): void {
        if (!this.root) {
            this.root = node;
            return;
        }

        let siblingNode = this.root;
        while (!siblingNode.isLeaf) {
            const currentNodeVolume = Utils.volume(siblingNode.box);
            const leftNode = siblingNode.left;
            const rightNode = siblingNode.right;

            if (leftNode === undefined || rightNode === undefined) {
                throw new Error('Tree node children cannot be undefined');
            }

            const newParentNodeBox = Utils.combine(siblingNode.box, node.box);
            const newParentNodeVolume = Utils.volume(newParentNodeBox);
            const newParentNodeCost = 2 * newParentNodeVolume;

            const minimumPushDownCost = newParentNodeCost - 2 * currentNodeVolume;

            const leftCost = this.calculateBranchingCost(leftNode, node.box) + minimumPushDownCost;
            const rightCost = this.calculateBranchingCost(rightNode, node.box) + minimumPushDownCost;

            if (newParentNodeCost < leftCost && newParentNodeCost < rightCost) {
                break;
            }

            if (leftCost <= rightCost) {
                siblingNode = leftNode;
            } else {
                siblingNode = rightNode;
            }
        }

        const oldParentNode = siblingNode.parent;
        const newParentBox = Utils.combine(node.box, siblingNode.box);
        const newParentNode = new BoundingBoxNode(newParentBox, undefined, node, siblingNode);
        siblingNode.parent = newParentNode;
        node.parent = newParentNode;

        if (!oldParentNode) {
            this.root = newParentNode;
            return;
        }

        if (oldParentNode.left === siblingNode) {
            oldParentNode.left = newParentNode;
        } else {
            oldParentNode.right = newParentNode;
        }

        this.fixTreeUpwards(oldParentNode);
    }

    removeNode(node: BoundingBoxNode<V>): void {
        if (!node.parent) {
            this.root = undefined;
            return;
        }

        const parentNode = node.parent;
        const grentParentNode = node.parent.parent;
        const siblingNode = parentNode.left === node ? parentNode.right : node;

        if (!siblingNode) {
            throw new Error('Tree node does not have a sibling');
        }

        if (grentParentNode) {
            if (grentParentNode.left === parentNode) {
                grentParentNode.left = siblingNode;
            } else {
                grentParentNode.right = siblingNode;
            }
            siblingNode.parent = grentParentNode;

            this.fixTreeUpwards(grentParentNode);
        } else {
            this.root = siblingNode;
            siblingNode.parent = undefined;
        }
    }

    getOverlappingNodes(box: BoundingBox): BoundingBoxNode<V>[] {
        const nodes: BoundingBoxNode<V>[] = [];
        const stack: BoundingBoxNode<V>[] = [];
        let i = 0;

        while (stack[i]) {
            const node = stack[i];

            if (Utils.overlaps(node.box, box)) {
                if (node.isLeaf) {
                    nodes.push(node);
                } else {
                    if (node.left === undefined || node.right === undefined) {
                        throw new Error('Tree node children cannot be undefined');
                    }

                    stack.push(node.left);
                    stack.push(node.right);
                }
            }

            i++;
        }

        return nodes;
    }
}
