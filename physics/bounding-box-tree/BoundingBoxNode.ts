import { assert } from '@/utils/assert';
import { BoundingBox } from '../bounding-box/BoundingBox';
import { BoundingBoxUtils } from '../bounding-box/BoundingBoxUtils';

export interface BoundingBoxNodeChildren<V> {
    left: BoundingBoxNode<V>;
    right: BoundingBoxNode<V>;
}

export interface BoundingBoxNodeOptions<V> {
    fatBox?: BoundingBox;
    fatGrowFactor?: number;
    realBox?: BoundingBox;
    parent?: BoundingBoxNode<V>;
    children?: BoundingBoxNodeChildren<V>;
    value?: V;
    maxHeight?: number;
}

export class BoundingBoxNode<V> {
    fatBox?: BoundingBox;
    fatGrowFactor?: number;
    realBox!: BoundingBox;
    parent?: BoundingBoxNode<V>;
    children?: BoundingBoxNodeChildren<V>;
    value?: V;
    maxHeight: number;

    constructor(options: BoundingBoxNodeOptions<V>) {
        if (options.maxHeight === undefined) {
            options.maxHeight = 1;
        }

        if (options.children !== undefined && options.realBox === undefined) {
            options.realBox = BoundingBoxUtils.combine(options.children.left.box,
                options.children.right.box);
        }

        assert(options.realBox !== undefined);

        this.realBox = options.realBox;
        this.fatGrowFactor = options.fatGrowFactor;
        this.children = options.children;
        this.value = options.value;
        this.parent = options.parent;
        this.maxHeight = options.maxHeight;

        if (this.children !== undefined) {
            this.children.left.parent = this;
            this.children.right.parent = this;
        }

        this.recalculateFatBox();
        this.recalculate(true);
    }

    get box(): BoundingBox {
        if (this.fatBox !== undefined) {
            return this.fatBox;
        }

        assert(this.realBox !== undefined);
        return this.realBox;
    }

    get left(): BoundingBoxNode<V> {
        assert(this.children !== undefined);

        return this.children.left;
    }

    set left(node: BoundingBoxNode<V>) {
        assert(this.children !== undefined);

        this.children.left = node;
    }

    get right(): BoundingBoxNode<V> {
        assert(this.children !== undefined);

        return this.children.right;
    }

    set right(node: BoundingBoxNode<V>) {
        assert(this.children !== undefined);

        this.children.right = node;
    }

    isFatBoxFitting(): boolean {
        if (this.fatBox === undefined) {
            return true;
        }

        return BoundingBoxUtils.contains(this.fatBox, this.realBox);
    }

    recalculateFatBox(): void {
        if (this.fatGrowFactor === undefined) {
            return;
        }

        this.fatBox = BoundingBoxUtils.grow(this.realBox, this.fatGrowFactor);
    }

    recalculateHeight(pass = false): void {
        if (pass && this.children === undefined) {
            return;
        }

        assert(this.children !== undefined);

        this.maxHeight = 1 + Math.max(this.children.left.maxHeight,
            this.children.right.maxHeight);
    }

    recalculateBox(pass = false): void {
        if (pass && this.children === undefined) {
            return;
        }

        assert(this.children !== undefined);

        this.realBox = BoundingBoxUtils.combine(this.children.left.box,
            this.children.right.box);
    }

    recalculate(pass = false): void {
        this.recalculateHeight(pass);
        this.recalculateBox(pass);
    }
}
