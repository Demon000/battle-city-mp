import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export interface ISprite {
    filename: string;
    image?: HTMLImageElement;
    duration?: number;
    offset?: Point;
    width?: number;
    height?: number;
}

export interface ISpriteSet {
    duration?: number;
    direction?: Direction;
    once?: boolean;
    position?: {
        mod: number,
        divide: number,
        equals: Point[];
    };
    meta?: Record<string, string | number>;

    steps: ISprite[];
}

export default interface IGameObjectProperties {
    type: string;
    shortType?: string;

    width: number;
    height: number;
    speed?: number;
    directionAxisSnapping?: number;
    automaticDestroyTime?: number;

    sets?: ISpriteSet[];
}
