import { Point } from './Point';

export class PointUtils {
    static clone(point: Point): Point {
        return {...point};
    }

    static min(first: Point, second: Point): Point {
        const x = Math.min(first.x, second.x);
        const y = Math.min(first.y, second.y);
        return { x, y };
    }

    static max(first: Point, second: Point): Point {
        const x = Math.max(first.x, second.x);
        const y = Math.max(first.y, second.y);
        return { x, y };
    }

    static add(first: Point, second: Point): Point {
        return {
            x: first.x + second.x,
            y: first.y + second.y,
        };
    }
}
