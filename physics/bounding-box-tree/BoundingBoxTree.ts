import BoundingBox from '../bounding-box/BoundingBox';
import BoundingBoxNode from './BoundingBoxNode';
import Utils from '../bounding-box/BoundingBoxUtils';
import BoundingBoxUtils from '../bounding-box/BoundingBoxUtils';
import { BoundingBoxTreeIterator } from './BoundingBoxTreeIterator';

export default class BoundingBoxTree<V> {
    rootIndex?: number;
    nodes = new Array<BoundingBoxNode<V>>();
    freeIndices = new Array<number>();

    calculateBranchingCost(node: BoundingBoxNode<V>, box: BoundingBox): number {
        const newNodeBox = Utils.combine(box, node.box);
        let cost = Utils.volume(newNodeBox);
        if (node.leftIndex !== undefined && node.rightIndex !== undefined) {
            cost -= Utils.volume(node.box);
        }
        return cost;
    }

    recalculateNodeHeight(node: BoundingBoxNode<V>): void {
        if (node.leftIndex === undefined || node.rightIndex === undefined) {
            throw new Error('Cannot recalculate height of leaf node');
        }

        const left = this.nodes[node.leftIndex];
        const right = this.nodes[node.rightIndex];

        node.maxHeight = 1 + Math.max(left.maxHeight, right.maxHeight);
    }

    recalculateNodeBox(node: BoundingBoxNode<V>): void {
        if (node.leftIndex === undefined || node.rightIndex === undefined) {
            throw new Error('Cannot recalculate box of leaf node');
        }

        const left = this.nodes[node.leftIndex];
        const right = this.nodes[node.rightIndex];

        node.box = BoundingBoxUtils.combine(left.box, right.box);
    }

    recalculateNode(node: BoundingBoxNode<V>): void {
        this.recalculateNodeBox(node);
        this.recalculateNodeHeight(node);
    }

    private swapNodeUp(up: BoundingBoxNode<V>, down: BoundingBoxNode<V>) {
        if (down.leftIndex === undefined || down.rightIndex === undefined) {
            throw new Error('Height of node being balanced is inconsistent with structure');
        }

        down.leftIndex = up.index;
        down.parentIndex = up.parentIndex;
        up.parentIndex = down.index;

        if (down.parentIndex === undefined) {
            this.rootIndex = down.index;
        } else {
            const downParent = this.nodes[down.parentIndex];
            if (downParent.leftIndex === up.index) {
                downParent.leftIndex = down.index;
            } else if (downParent.rightIndex === up.index) {
                downParent.rightIndex = down.index;
            } else {
                throw new Error('Parent of node being rotated is inconsistent');
            }
        }

        const left = this.nodes[down.leftIndex];
        const right = this.nodes[down.rightIndex];
        let newDownRightNode;
        let replaceOldDownNode;
        if (left.maxHeight > right.maxHeight) {
            newDownRightNode = left;
            replaceOldDownNode = right;
        } else {
            newDownRightNode = right;
            replaceOldDownNode = left;
        }

        if (up.rightIndex === down.index) {
            up.rightIndex = replaceOldDownNode.index;
        } else if (up.leftIndex === down.index) {
            up.leftIndex = replaceOldDownNode.index;
        } else {
            throw new Error('Parent of node being rotated is inconsistent');
        }

        down.rightIndex = newDownRightNode.index;
        replaceOldDownNode.parentIndex = up.index;

        this.recalculateNode(up);
        this.recalculateNode(down);
    }

    private balance(node: BoundingBoxNode<V>): BoundingBoxNode<V> {
        if (node.leftIndex === undefined || node.rightIndex === undefined || node.maxHeight < 4) {
            return node;
        }

        const left = this.nodes[node.leftIndex];
        const right = this.nodes[node.rightIndex];
        const balance = right.maxHeight - left.maxHeight;
        if (balance === 0) {
            return node;
        }

        let nodeToSwapIndex;
        if (balance > 1) {
            nodeToSwapIndex = node.rightIndex;
        } else if (balance < -1) {
            nodeToSwapIndex = node.leftIndex;
        }

        if (nodeToSwapIndex !== undefined) {
            const nodeToSwap = this.nodes[nodeToSwapIndex];
            this.swapNodeUp(node, nodeToSwap);
            return nodeToSwap;
        }

        return node;
    }

    fixTreeUpwards(node?: BoundingBoxNode<V>): void {
        while (node !== undefined) {
            if (node.leftIndex !== undefined && node.rightIndex !== undefined) {
                this.recalculateNode(node);
            }

            node = this.balance(node);
            if (node.parentIndex === undefined) {
                return;
            }

            node = this.nodes[node.parentIndex];
        }
    }

    getFreeIndex(): number {
        if (this.freeIndices.length) {
            return this.freeIndices.pop()!;
        } else {
            return this.nodes.length;
        }
    }

    setToFreeIndex(node: BoundingBoxNode<V>): void {
        const index = this.getFreeIndex();
        node.index = index;
        this.nodes[index] = node;
    }

    freeIndex(index: number): void {
        delete this.nodes[index];
        this.freeIndices.push(index);
    }

    addNode(node: BoundingBoxNode<V>): void {
        this.setToFreeIndex(node);
        if (this.rootIndex === undefined) {
            this.rootIndex = node.index;
            return;
        }

        let siblingNode = this.nodes[this.rootIndex];
        while (siblingNode.leftIndex !== undefined && siblingNode.rightIndex !== undefined) {
            const currentNodeVolume = Utils.volume(siblingNode.box);

            const newParentNodeBox = Utils.combine(siblingNode.box, node.box);
            const newParentNodeVolume = Utils.volume(newParentNodeBox);
            const newParentNodeCost = 2 * newParentNodeVolume;

            const minimumPushDownCost = newParentNodeCost - 2 * currentNodeVolume;

            const siblingNodeLeft = this.nodes[siblingNode.leftIndex];
            const leftCost = this.calculateBranchingCost(siblingNodeLeft, node.box) + minimumPushDownCost;

            const siblingNodeRight = this.nodes[siblingNode.rightIndex];
            const rightCost = this.calculateBranchingCost(siblingNodeRight, node.box) + minimumPushDownCost;

            if (newParentNodeCost < leftCost && newParentNodeCost < rightCost) {
                break;
            }

            if (leftCost <= rightCost) {
                siblingNode = this.nodes[siblingNode.leftIndex];
            } else {
                siblingNode = this.nodes[siblingNode.rightIndex];
            }
        }

        const oldParentNodeIndex = siblingNode.parentIndex;
        const newParentNode = new BoundingBoxNode<V>();
        this.setToFreeIndex(newParentNode);
        newParentNode.box = BoundingBoxUtils.combine(node.box, siblingNode.box);
        newParentNode.leftIndex = node.index;
        newParentNode.rightIndex = siblingNode.index;
        newParentNode.parentIndex = oldParentNodeIndex;
        node.parentIndex = siblingNode.parentIndex = newParentNode.index;

        if (oldParentNodeIndex === undefined) {
            this.rootIndex = newParentNode.index;
            return;
        }

        const oldParentNode = this.nodes[oldParentNodeIndex];
        if (oldParentNode.leftIndex === siblingNode.index) {
            oldParentNode.leftIndex = newParentNode.index;
        } else if (oldParentNode.rightIndex === siblingNode.index) {
            oldParentNode.rightIndex = newParentNode.index;
        } else {
            throw new Error('Parent of node being pushed down is inconsistent');
        }

        this.fixTreeUpwards(oldParentNode);
    }

    removeNode(node: BoundingBoxNode<V>): void {
        if (node.parentIndex === undefined) {
            this.clearNodes();            
            return;
        }

        const parentNode = this.nodes[node.parentIndex];
        const grandParentNodeIndex = parentNode.parentIndex;

        let siblingNodeIndex;
        if (parentNode.leftIndex === node.index) {
            siblingNodeIndex = parentNode.rightIndex;
        } else if (parentNode.rightIndex === node.index) {
            siblingNodeIndex = parentNode.leftIndex;
        } else {
            throw new Error('Parent of node being removed is inconsistent');
        }

        if (siblingNodeIndex === undefined) {
            throw new Error('Tree node does not have a sibling');
        }

        let grandParentNode;
        if (grandParentNodeIndex === undefined) {
            this.rootIndex = siblingNodeIndex;
        } else {
            grandParentNode = this.nodes[grandParentNodeIndex];
            if (grandParentNode.leftIndex === node.parentIndex) {
                grandParentNode.leftIndex = siblingNodeIndex;
            } else if (grandParentNode.rightIndex === node.parentIndex) {
                grandParentNode.rightIndex = siblingNodeIndex;
            } else {
                throw new Error('Grand parent of node being removed is inconsistent');
            }
        }

        const siblingNode = this.nodes[siblingNodeIndex];
        siblingNode.parentIndex = grandParentNodeIndex;
        this.fixTreeUpwards(grandParentNode);
        this.freeIndex(node.parentIndex);
        this.freeIndex(node.index);
    }

    getOverlappingNodes(box: BoundingBox): Iterable<BoundingBoxNode<V>> {
        return {
            [Symbol.iterator]: () => {
                return new BoundingBoxTreeIterator(box, this.rootIndex, this.nodes);
            },
        };
    }

    clearNodes(): void {
        this.rootIndex = undefined;
        this.nodes.length = 0;
        this.freeIndices.length = 0;
    }
}
