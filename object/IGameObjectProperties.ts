import IBaseDrawable from '@/drawable/IBaseDrawable';

export enum RenderPass {
    ALL = 0,
    TANK = 1,
    BULLET = 1,
    BUSHES = 2,
    EXPLOSIONS = 3,
    SMOKE = 3,
}

// eslint-disable-next-line
export type ResourceMeta = Record<string, any>;

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

    drawables?: IBaseDrawable[];
    audioEffects?: IAudioEffect[];
}
