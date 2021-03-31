import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export enum RenderPass {
    ALL = 0,
    BUSHES = 1,
    EXPLOSIONS = 2,
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

export enum AudioEffectLoadingState {
    LOADING = 'loading',
    LOADED = 'loaded',
}

export interface IAudioEffect {
    filename: string;
    loop?: boolean;
    buffer?: AudioBuffer;
    state?: AudioEffectLoadingState;
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
