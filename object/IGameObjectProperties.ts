import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export enum RenderPass {
    ALL = 0,
    EXPLOSIONS = 1,
}

export interface ISprite {
    filename: string;
    image?: HTMLImageElement;
    duration?: number;
    offset?: Point;
    width?: number;
    height?: number;
    renderPass?: number;
}

export type ResourceMeta = Record<string, string | number | boolean>;

export interface ISpriteSet {
    duration?: number;
    direction?: Direction;
    loop?: boolean;
    position?: {
        mod: number,
        divide: number,
        equals: Point[];
    };
    meta?: ResourceMeta;
    steps: ISprite[];
}

export interface IAudioEffect {
    filename: string;
    loop?: boolean;
    buffer?: AudioBuffer;
    meta?: ResourceMeta;
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
