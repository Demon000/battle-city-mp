import { Point } from '@/physics/point/Point';

export class GameCamera {
    position?: Point;

    setPosition(position: Point): void {
        this.position = position;
    }

    getPosition(): Point | undefined {
        if (this.position === undefined) {
            return undefined;
        }

        return {
            x: Math.floor(this.position.x),
            y: Math.floor(this.position.y),
        };
    }
}
