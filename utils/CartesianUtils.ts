import Point from '@/physics/point/Point';

interface CartesianPositioned {
    readonly positionX: AudioParam;
    readonly positionY: AudioParam;
    readonly positionZ: AudioParam;
}

export default class CartesianUtils {
    static setCartesianPositions(positioned: CartesianPositioned, point: Point): void {
        positioned.positionX.value = point.y;
        positioned.positionY.value = 1;
        positioned.positionZ.value = -point.x; 
    }
}
