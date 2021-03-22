export interface ISprite {
    filename: string;
    image?: HTMLImageElement;
    width?: number;
    height?: number;
    duration?: number;
}

export interface ISpriteSet {
    steps: ISprite[];
    duration?: number;
}

export default interface IGameObjectProperties {
    type: string;
    shortType?: string;

    width: number;
    height: number;
    speed?: number;

    sprites?: Record<string, ISpriteSet>;
}
