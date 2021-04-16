import IDrawable from '@/drawable/IDrawable';

export enum RenderPass {
    ALL,
    BULLET,
    TANK,
    TANK_NAME,
    BUSHES,
    EXPLOSIONS,
    SMOKE = EXPLOSIONS,
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

    drawables?: IDrawable[];
    audioEffects?: IAudioEffect[];
}
