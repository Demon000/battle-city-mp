export type ResourceMeta = Record<string, any>;

export enum AudioEffectLoadingState {
    LOADING = 'loading',
    LOADED = 'loaded',
}

export interface AudioEffect {
    filename: string;
    loop?: boolean;
    buffer?: AudioBuffer;
    state?: AudioEffectLoadingState;
    meta?: ResourceMeta;
}

export interface GameObjectProperties {
    type: string;
    audioEffects?: AudioEffect[];
}
