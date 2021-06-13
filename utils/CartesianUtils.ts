import { Point } from '@/physics/point/Point';

export interface CartesianPositioned {
    readonly positionX: AudioParam;
    readonly positionY: AudioParam;
    readonly positionZ: AudioParam;
    setPosition(x: number, y: number, z: number): void;
}

export class CartesianUtils {
    static setCartesianPositions(positioned: CartesianPositioned, point: Point): void {
        if (positioned.positionX !== undefined) {
            positioned.positionX.value = point.y;
            positioned.positionY.value = 1;
            positioned.positionZ.value = -point.x;
        } else {
            positioned.setPosition(point.y, 1, -point.x);
        }
    }
}
