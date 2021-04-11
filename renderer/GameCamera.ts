import GameObject from '@/object/GameObject';
import Point from '@/physics/point/Point';

export default class GameCamera {
    private lastUpdateSeconds?: number;
    private lastPosition?: Point;
    private currentPosition?: Point;
    private interpolationSeconds = 0;
    watchedObject?: GameObject;

    private getCurrentSeconds(): number {
        return Date.now() / 1000;
    }

    setInterpolationTime(seconds: number): void {
        this.interpolationSeconds = seconds;
    }

    setPosition(position: Point): void {
        if (this.lastPosition === undefined) {
            this.lastPosition = position;
        } else {
            this.lastPosition = this.currentPosition;
        }
        this.currentPosition = position;
        this.lastUpdateSeconds = this.getCurrentSeconds();
    }

    getPosition(): Point | undefined {
        if (this.lastUpdateSeconds === undefined || this.lastPosition === undefined
            || this.currentPosition === undefined) {
            return undefined;
        }

        const secondsDelta = this.getCurrentSeconds() - this.lastUpdateSeconds;
        const interpolationValue = secondsDelta * this.interpolationSeconds;
        const deltaX = interpolationValue * (this.currentPosition.x - this.lastPosition.x);
        const deltaY = interpolationValue * (this.currentPosition.y - this.lastPosition.y);

        return {
            x: Math.floor(this.lastPosition.x + deltaX),
            y: Math.floor(this.lastPosition.y + deltaY),
        };
    }
}
