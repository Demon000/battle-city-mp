import { EntitiesOwnerComponent } from '@/components/EntitiesOwnerComponent';
import { TeamComponent } from '@/components/TeamComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { assert } from '@/utils/assert';
import { setPlayerTeamId } from './player';

export function removeTeamPlayer(team: Entity, player: Entity): void {
    const entitiesComponent = team.getComponent(EntitiesOwnerComponent);
    const ids = entitiesComponent.ids;

    delete ids[player.id];

    entitiesComponent.update({
        ids,
    });
}

export function addTeamPlayer(team: Entity, player: Entity): void {
    const entitiesComponent = team.getComponent(EntitiesOwnerComponent);
    const ids = entitiesComponent.ids;

    ids[player.id] = true;

    entitiesComponent.update({
        ids,
    });
}

export function getTeamNumberOfPlayers(team: Entity): number {
    const entitiesComponent = team.getComponent(EntitiesOwnerComponent);

    return Object.keys(entitiesComponent.ids).length;
}

export function getTeamWithLeastPlayers(registry: Registry): Entity {
    let leastPlayersTeam = null;
    let leastPlayersTeamLength = null;

    for (const team of registry.getEntitiesWithComponent(TeamComponent)) {
        const length = getTeamNumberOfPlayers(team);

        if (leastPlayersTeam === null
            || leastPlayersTeamLength === null
            || leastPlayersTeamLength > length) {
            leastPlayersTeam = team;
            leastPlayersTeamLength = length;
        }
    }

    assert(leastPlayersTeam !== null);

    return leastPlayersTeam;
}

export function isTeamSwitchingAllowed(
    fromTeam: Entity,
    toTeam: Entity,
): boolean {
    return getTeamNumberOfPlayers(toTeam) <= getTeamNumberOfPlayers(fromTeam);
}

export function onTeamBeforeDestroy(
    registry: Registry,
    team: Entity,
): void {
    const entitiesComponent = team.getComponent(EntitiesOwnerComponent);

    for (const playerId of Object.keys(entitiesComponent.ids)) {
        const player = registry.getEntityById(playerId);
        setPlayerTeamId(registry, player, null);
    }
}
