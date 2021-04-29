export enum SameTeamBulletHitMode {
    ALLOW = 'allow',
    PASS = 'pass',
    DESTROY = 'destroy',
}

export interface IGameModeProperties {
    hasTeams: boolean;
    sameTeamBulletHitMode: SameTeamBulletHitMode;
}
