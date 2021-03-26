import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export interface ISprite {
    filename: string;
    image?: HTMLImageElement;
    duration?: number;
}

export interface ISpriteSet {
    duration?: number;
    direction?: Direction;
    position?: {
        mod: number,
        divide: number,
        equals: Point[];
    };

    steps: ISprite[];
}

export default interface IGameObjectProperties {
    type: string;
    shortType?: string;

    width: number;
    height: number;
    speed?: number;

    sets?: ISpriteSet[];
}
