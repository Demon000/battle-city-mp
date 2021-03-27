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

    static overlaps(first: BoundingBox, second: BoundingBox, tolernace = 0): boolean {
        return first.tl.x - second.br.x <= -tolernace && first.br.x - second.tl.x >= tolernace &&
                first.tl.y - second.br.y <= -tolernace && first.br.y - second.tl.y >= tolernace;
    }
}
