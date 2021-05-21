import Point from '@/physics/point/Point';

export default class GameCamera {
    position?: Point;

    setPosition(position: Point): void {
        this.position = position;
    }

    getPosition(): Point | undefined {
        if (this.position === undefined) {
            return undefined;
        }

        return {
            x: this.position.x,
            y: this.position.y,
        };
    }
}
