import BoundingBox from '../bounding-box/BoundingBox';

export default class BoundingBoxNode<V> {
    box!: BoundingBox;
    index!: number;
    parentIndex?: number;
    leftIndex?: number;
    rightIndex?: number;
    value?: V;
    maxHeight!: number;
}
