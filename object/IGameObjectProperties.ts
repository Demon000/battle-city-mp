export enum SpriteWrapMode {
    SCALE = 'scale',
    SPAN_MULTIPLE = 'span-multiple',
}

export interface ISprite {
    filename: string;
    wrapMode?: SpriteWrapMode;
}

export interface IAnimationStep {
    sprites: ISprite[];
    duration: number;
}

export interface IAnimationSet {
    state: string;
    steps: IAnimationStep;
}

export default interface IGameObjectProperties {
    type: string;
    shortType?: string;

    width: number;
    height: number;
    speed?: number;

    animations?: IAnimationSet[];
    sprite?: ISprite;
}
