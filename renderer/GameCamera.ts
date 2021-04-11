import GameObject from '@/object/GameObject';
import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export default class GameCamera {
    private lastUpdateSeconds?: number;
    private lastPosition?: Point;
    watchedObject?: GameObject;

    getCurrentSeconds(): number {
        return Date.now() / 1000;
    }

    setWatchedObject(object: GameObject | undefined): void {
        this.watchedObject = object;
        this.updateWatchedPosition();
    }

    updateWatchedPosition(): void {
        if (this.watchedObject === undefined) {
            return;
        }

        this.lastPosition = this.watchedObject.centerPosition;
        this.lastUpdateSeconds = this.getCurrentSeconds();
    }

    getPosition(): Point | undefined {
        const currentSeconds = this.getCurrentSeconds();
        if (this.lastUpdateSeconds === undefined || this.lastPosition === undefined) {
            return undefined;
        }

        if (this.watchedObject === undefined) {
            return this.lastPosition;
        }

        console.log(currentSeconds, this.lastUpdateSeconds);
        const distance = this.watchedObject.movementSpeed * (currentSeconds - this.lastUpdateSeconds);
        console.log(distance);
        if (this.watchedObject.direction === Direction.UP) {
            this.lastPosition.y -= distance;
        } else if (this.watchedObject.direction === Direction.RIGHT) {
            this.lastPosition.x += distance;
        } else if (this.watchedObject.direction === Direction.DOWN) {
            this.lastPosition.y += distance;
        } else if (this.watchedObject.direction === Direction.LEFT) {
            this.lastPosition.x -= distance;
        }

        return {
            x: Math.floor(this.lastPosition.x),
            y: Math.floor(this.lastPosition.y),
        };
    }
}
