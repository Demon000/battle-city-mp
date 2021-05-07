export enum SameTeamBulletHitMode {
    ALLOW = 'allow',
    PASS = 'pass',
    DESTROY = 'destroy',
}

export interface IGameModeProperties {
    hasTeams: boolean;
    sameTeamBulletHitMode: SameTeamBulletHitMode;
}

export type GameModesProperties = Record<string, IGameModeProperties>;
