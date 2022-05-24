import { BoundingBox } from './BoundingBox';
import { PointUtils } from '../point/PointUtils';
import { Point } from '../point/Point';

export class BoundingBoxUtils {
    static create(tlx: number, tly: number, brx: number, bry: number): BoundingBox {
        return {
            tl: {
                x: tlx,
                y: tly,
            },
            br: {
                x: brx,
                y: bry,
            },
        };
    }

    static reposition(
        box: BoundingBox,
        originalPosition: Point,
        newPosition: Point,
    ): BoundingBox {
        const offsetX = - originalPosition.x + newPosition.x;
        const offsetY = - originalPosition.y + newPosition.y;
        return {
            tl: {
                x: box.tl.x + offsetX,
                y: box.tl.y + offsetY,
            },
            br: {
                x: box.br.x + offsetX,
                y: box.br.y + offsetY,
            },
        };
    }

    static center(box: BoundingBox): Point {
        return {
            x: (box.tl.x + box.br.x) / 2,
            y: (box.tl.y + box.br.y) / 2,
        };
    }

    static volume(box: BoundingBox): number {
        const wx = box.br.x - box.tl.x;
        const wy = box.br.y - box.tl.y;
        return wx * wy;
    }

    static clone(box: BoundingBox): BoundingBox {
        return this.create(box.tl.x, box.tl.y, box.br.x, box.br.y);
    }

    static combine(first: BoundingBox, second: BoundingBox): BoundingBox {
        const tl = PointUtils.min(first.tl, second.tl);
        const br = PointUtils.max(first.br, second.br);
        return { tl, br };
    }

    static intersect(first: BoundingBox, second: BoundingBox): BoundingBox {
        const tl = PointUtils.max(first.tl, second.tl);
        const br = PointUtils.min(first.br, second.br);
        return { tl, br };
    }

    static overlaps(first: BoundingBox, second: BoundingBox): boolean {
        return first.tl.x < second.br.x && first.br.x > second.tl.x &&
                first.tl.y < second.br.y && first.br.y > second.tl.y;
    }

    static contains(big: BoundingBox, small: BoundingBox): boolean {
        return big.tl.x <= small.tl.x && big.tl.y <= small.tl.y &&
                big.br.x >= small.br.x && big.br.y >= small.br.y;
    }

    static grow(box: BoundingBox, factor: number): BoundingBox {
        const expandWidth = (box.br.x - box.tl.x) * factor;
        const expandHeight = (box.br.y - box.tl.y) * factor;
        return this.create(box.tl.x - expandWidth, box.tl.y - expandHeight,
            box.br.x + expandWidth, box.br.y + expandHeight);
    }
}
