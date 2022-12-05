import { SpawnComponent } from '@/components/SpawnComponent';
import { EntityType } from '@/entity/EntityType';
import { PlayerSpawnStatus } from '@/player/Player';
import { FlagTankInteraction, handleFlagDrop } from './flag';
import { PluginContext } from './plugin';
import { pickRandomSpawnPosition } from './spawn';
import { createTankForPlayer } from './tank';
import { createSpawnEffect } from './spawn-effect';
import { markDestroyed } from './entity-destroy';
import { Direction } from '@/physics/Direction';
import { setMovementDirection } from './entity-movement';
import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { setEntitySpawnerStatus } from './entity-spawner';

function setPlayerTeam(
    this: PluginContext,
    playerId: string,
    teamId: string | null,
): void {
    const player = this.playerService.getPlayer(playerId);
    if (player.teamId !== null) {
        this.teamService.removeTeamPlayer(player.teamId, playerId);
    }

    if (teamId !== null) {
        this.teamService.addTeamPlayer(teamId, playerId);
    }

    this.playerService.setPlayerTeamId(playerId, teamId);
}


export function onPlayerRequestedSpawnStatus(
    this: PluginContext,
    playerId: string,
    status: PlayerSpawnStatus,
): void {
    const player = this.playerService.getPlayer(playerId);

    if (status === PlayerSpawnStatus.SPAWN && player.tankId === null) {
        const gameModeProperties = this.gameModeService.getGameModeProperties();
        if (gameModeProperties.hasTeams && player.teamId === null) {
            const team = this.teamService.getTeamWithLeastPlayers();
            setPlayerTeam.call(this, playerId, team.id);
        }

        let tankColor;
        if (gameModeProperties.hasTeams && player.teamId !== null) {
            const team = this.teamService.getTeam(player.teamId);
            tankColor = team.color;
        } else {
            tankColor = player.requestedTankColor;
        }

        const entities = this.registry.getEntitiesWithComponent(SpawnComponent);
        const position = pickRandomSpawnPosition(entities, player.teamId);
        createTankForPlayer(this.entityFactory, player, position, tankColor);
        createSpawnEffect(this.entityFactory, position);
    } else if (status === PlayerSpawnStatus.DESPAWN && player.tankId !== null) {
        const tank = this.registry.getEntityById(player.tankId);
        markDestroyed(tank);
    }
}

export function onPlayerRequestedDropFlag(
    this: PluginContext,
    playerId: string,
): void {
    const player = this.playerService.getPlayer(playerId);
    if (player.tankId === null) {
        return;
    }

    const tank = this.registry.getEntityById(player.tankId);
    const carriedFlag = this.collisionService
        .findRelativePositionEntityWithType(tank,
            EntityType.FLAG);
    if (carriedFlag !== undefined) {
        handleFlagDrop(this.registry, this.playerService,
            tank, undefined, carriedFlag, undefined,
            FlagTankInteraction.DROP);
    }
}

export function onPlayerRequestedTeam(
    this: PluginContext,
    playerId: string,
    teamId: string | null,
): void {
    const gameModeProperties = this.gameModeService.getGameModeProperties();
    if (!gameModeProperties.hasTeams) {
        return;
    }

    if (teamId !== null) {
        const team = this.teamService.findTeamById(teamId);
        if (team === undefined) {
            return;
        }

        const player = this.playerService.getPlayer(playerId);
        let existingTeam;
        if (player.teamId !== null) {
            existingTeam = this.teamService.getTeam(player.teamId);
        } else {
            existingTeam = this.teamService.getTeamWithLeastPlayers();
        }

        if (!this.teamService.isTeamSwitchingAllowed(existingTeam.id, team.id)) {
            return;
        }
    }

    setPlayerTeam.call(this, playerId, teamId);
}

export function onPlayerRequestedMove(
    this: PluginContext,
    playerId: string,
    direction: Direction | undefined,
): void {
    const player = this.playerService.getPlayer(playerId);
    if (player.tankId === null) {
        return;
    }

    const tank = this.registry.getEntityById(player.tankId);
    setMovementDirection(tank, direction);
}

export function onPlayerRequestedShoot(
    this: PluginContext,
    playerId: string,
    isShooting: boolean,
): void {
    const player = this.playerService.getPlayer(playerId);
    if (player.tankId === null) {
        return;
    }

    const tank = this.registry.getEntityById(player.tankId);
    setEntitySpawnerStatus(tank, BulletSpawnerComponent, isShooting);
}
