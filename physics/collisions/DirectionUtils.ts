import { Direction } from '../Direction';

export default class DirectionUtils {
    static isVerticalAxis(direction: Direction): boolean {
        return [Direction.UP, Direction.DOWN].includes(direction);
    }

    static isHorizontalAxis(direction: Direction): boolean {
        return [Direction.LEFT, Direction.RIGHT].includes(direction);
    }

    static isSameAxis(first: Direction, second: Direction): boolean {
        return (this.isHorizontalAxis(first) && this.isHorizontalAxis(second))
            || (this.isVerticalAxis(first) && this.isVerticalAxis(second));
    }
}
