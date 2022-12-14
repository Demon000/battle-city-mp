import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export enum SameTeamBulletHitMode {
    ALLOW = 'allow',
    PASS = 'pass',
    DESTROY = 'destroy',
}

export enum GameModeTypes {
    DEATHMATCH = 'deathmatch',
    TEAM_DEATHMATCH = 'team-deathmatch',
    CAPTURE_THE_FLAG = 'capture-the-flag',
};

export interface GameModeComponentData {
    hasTeams: boolean;
    sameTeamBulletHitMode: SameTeamBulletHitMode;
    ignoredEntityTypes: string[];
}

export class GameModeComponent extends Component
    implements GameModeComponentData {
    static TAG = 'GM';

    hasTeams = false;
    sameTeamBulletHitMode = SameTeamBulletHitMode.ALLOW;
    ignoredEntityTypes: string[] = [];
}

registerComponent(GameModeComponent,
	createAssert<Partial<GameModeComponentData>>());
