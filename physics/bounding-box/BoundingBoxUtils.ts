import BoundingBox from './BoundingBox';
import PointUtils from '../point/PointUtils';

export default class BoundingBoxUtils {
    static volume(box: BoundingBox): number {
        const wx = box.br.x - box.tl.x;
        const wy = box.br.y - box.tl.y;
        return wx * wy;
    }

    static combine(first: BoundingBox, second: BoundingBox): BoundingBox {
        const tl = PointUtils.min(first.tl, second.tl);
        const br = PointUtils.max(first.br, second.br);
        return { tl, br };
    }

    static contains(big: BoundingBox, small: BoundingBox): boolean {
        return big.tl.x <= small.tl.x && big.tl.y <= small.tl.y &&
                big.br.x >= small.br.x && big.br.y >= small.br.y;
    }

    static overlaps(first: BoundingBox, second: BoundingBox): boolean {
        return first.tl.x <= second.br.x && first.br.x >= second.tl.x &&
                first.tl.y <= second.tl.y && first.br.y >= second.tl.y; 
    }
}