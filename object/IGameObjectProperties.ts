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
    loop?: boolean;
    position?: {
        mod: number,
        divide: number,
        equals: Point[];
    };
    meta?: Record<string, string | number>;

    steps: ISprite[];
}

export interface IAudioEffect {
    filename: string;
    loop?: boolean;
    buffer?: AudioBuffer;
    meta?: Record<string, string | number>;
}

export default interface IGameObjectProperties {
    type: string;
    shortType?: string;

    width: number;
    height: number;
    speed?: number;
    directionAxisSnapping?: number;
    automaticDestroyTime?: number;

    spriteSets?: ISpriteSet[];
    audioEffects?: IAudioEffect[];
}
