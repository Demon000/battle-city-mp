export enum CollisionRuleType {
    PREVENT_MOVEMENT = 'prevent-movement',
    TRACK = 'track',
}

export type CollisionRule = {
    type: CollisionRuleType.PREVENT_MOVEMENT;
    component?: string;
} | {
    type: CollisionRuleType.TRACK;
    component?: string;
    minimumVolume?: number;
};
