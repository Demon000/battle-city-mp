import { Direction } from '@/physics/Direction';
import Point from '@/physics/point/Point';

export enum RenderPass {
    ALL = 0,
    TANK = 1,
    BULLET = 1,
    BUSHES = 2,
    EXPLOSIONS = 3,
}

export interface ISprite {
    filename: string;
    image?: HTMLImageElement;
    duration?: number;
    offset?: Point;
    width?: number;
    height?: number;
    renderPass?: number;
    canvas?: OffscreenCanvas;
    context?: OffscreenCanvasRenderingContext2D;
    canvasRenderedWidth?: number;
    canvasRenderedHeight?: number;
}

// eslint-disable-next-line
export type ResourceMeta = Record<string, any>;

export interface ISpriteSetPositionMatching {
    mod: number,
    divide: number,
    equals: Point[];
}

export interface ISpriteSet {
    duration?: number;
    direction?: Direction;
    loop?: boolean;
    position?: ISpriteSetPositionMatching;
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
    directionAxisSnapping?: number;
    automaticDestroyTime?: number;

    spriteSets?: ISpriteSet[];
    audioEffects?: IAudioEffect[];
}
