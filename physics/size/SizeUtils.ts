import Point from '../point/Point';
import Size from './Size';

export default class SizeUtils {
    static toPoint(size: Size): Point {
        return {
            x: size.width,
            y: size.height,
        };
    }
}
