import { GameObjectType, GameShortObjectType } from './GameObjectType';

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
    type: GameObjectType;
    shortType?: GameShortObjectType;

    width: number;
    height: number;
    depth: number;
    positionZ: number;
    savable?: boolean;
    directionAxisSnapping?: number;
    automaticDestroyTime?: number;

    audioEffects?: IAudioEffect[];
}
