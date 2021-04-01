import Point from '@/physics/point/Point';

export default class GameCamera {
    position?: Point;

    setPosition(position: Point): void {
        this.position = position;
    }

    getPosition(): Point | undefined {
        return this.position;
    }
}
