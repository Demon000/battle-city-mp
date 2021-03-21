import Point from './Point';

export default class PointUtils {
    static clone(point: Point): Point {
        return {...point};
    }

    static min(first: Point, second: Point): Point {
        const x = Math.min(first.x, second.x);
        const y = Math.min(first.x, second.x);
        return { x, y };
    }

    static max(first: Point, second: Point): Point {
        const x = Math.max(first.x, second.x);
        const y = Math.max(first.x, second.x);
        return { x, y };
    }

    static is(value: Record<string, any>): boolean {
        return 'x' in value && 'y' in value;
    }
}
