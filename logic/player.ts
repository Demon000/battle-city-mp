import { SpawnComponent } from '@/components/SpawnComponent';
import { EntityType } from '@/entity/EntityType';
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
import { PlayerComponent, PlayerSpawnStatus } from '@/components/PlayerComponent';
import { PlayerPoints, PlayerPointsEvent } from '@/player/PlayerPoints';
import { Entity } from '@/ecs/Entity';
import { EntityId } from '@/ecs/EntityId';
import { addTeamPlayer, getTeamWithLeastPlayers, isTeamSwitchingAllowed, removeTeamPlayer } from './team';
import { EntitiesOwnerComponent } from '@/components/EntitiesOwnerComponent';
import { ColorComponent } from '@/components/ColorComponent';
import { PlayerRequestedServerStatusComponent } from '@/components/PlayerRequestedServerStatusComponent';
import { ButtonPressAction, ButtonState, ButtonType, BUTTON_TYPE_DIRECTION, MOVE_BUTTON_TYPES } from '@/actions/ButtonPressAction';
import { PlayerRequestedSpawnStatusComponent } from '@/components/PlayerRequestedSpawnStatusComponent';
import { EntityFactory } from '@/entity/EntityFactory';
import { Color } from '@/drawable/Color';
import { TankTier } from '@/subtypes/TankTier';
import { Registry } from '@/ecs/Registry';
import { assert } from '@/utils/assert';
import { PlayerRespawnTimeoutComponent } from '@/components/PlayerRespawnTimeoutComponent';
import { PlayerInputComponent } from '@/components/PlayerInputComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { NameComponent } from '@/components/NameComponent';
import { PlayerRequestedDisconnectComponent } from '@/components/PlayerRequestedDisconnect';
import { PlayerRespawnTimeoutConfigComponent } from '@/components/PlayerRespawnTimeoutConfigComponent';

export function createPlayer(
    entityFactory: EntityFactory,
    playerId: EntityId,
): Entity {
    return entityFactory.buildFromOptions({
        type: EntityType.PLAYER,
        id: playerId,
        components: {
            PlayerComponent: {
                name: playerId,
            },
        },
    });
}

export function resetPlayers(registry: Registry): void {
    for (const player of registry.getEntitiesWithComponent(PlayerComponent)) {
        setPlayerPoints(player, 0);
        setPlayerKills(player, 0);
        setPlayerDeaths(player, 0);
        setPlayerRespawnTimeout(player, 0);
    }
}

function cancelPlayerActions(player: Entity): void {
    const playerInputComponent = player.getComponent(PlayerInputComponent);

    playerInputComponent.map.clear();
}

export function cancelPlayersActions(registry: Registry): void {
    for (const player of registry.getEntitiesWithComponent(PlayerComponent)) {
        cancelPlayerActions(player);
    }
}

export function setPlayerName(player: Entity, value: string) {
    player.upsertComponent(NameComponent, {
        value,
    });
}

export function setPlayerRequestedDisconnect(player: Entity) {
    player.upsertComponent(PlayerRequestedDisconnectComponent);
}

export function setPlayerRequestedTankColor(player: Entity, value: Color) {
    const colorComponent = player.getComponent(ColorComponent);

    colorComponent.update({
        value,
    });
}

export function setPlayerRequestedTankTier(
    player: Entity,
    requestedTankTier: TankTier,
) {
    const playerComponent = player.getComponent(PlayerComponent);

    playerComponent.update({
        requestedTankTier,
    });
}

export function getPlayerTeamId(player: Entity): EntityId | null {
    const teamComponent = player.findComponent(TeamOwnedComponent);
    if (teamComponent === undefined) {
        return null;
    }

    return teamComponent.teamId;
}

export function getPlayerTankId(player: Entity): EntityId | null {
    const entitiesComponent = player.getComponent(EntitiesOwnerComponent);
    const ids = Object.keys(entitiesComponent.ids);

    assert(ids.length <= 1);

    return ids.length === 0 ? null : ids[0];
}

export function setPlayerTank(
    player: Entity,
    tank: Entity | null,
): void {
    const entitiesComponent = player.getComponent(EntitiesOwnerComponent);
    const playerTankId = getPlayerTankId(player);
    const tankId = tank === null ? null : tank.id;
    const ids = entitiesComponent.ids;

    if (playerTankId === tankId) {
        return;
    }

    if (tankId === null) {
        assert(playerTankId !== null);
        delete ids[playerTankId];
        resetPlayerRespawnTimeout(player);
    } else {
        ids[tankId] = true;
    }

    entitiesComponent.update({
        ids,
    });
}

function setPlayerTeamId(
    registry: Registry,
    player: Entity,
    teamId: EntityId | null,
): void {
    const oldTeamId = getPlayerTeamId(player);

    if (oldTeamId !== null) {
        const team = registry.getEntityById(oldTeamId);

        removeTeamPlayer(team, player);
    }

    if (teamId !== null) {
        const team = registry.getEntityById(teamId);

        addTeamPlayer(team, player);
    }

    player.upsertComponent(TeamOwnedComponent, {
        teamId,
    });
}

export function setPlayerRequestedSpawnStatus(
    player: Entity,
    value: PlayerSpawnStatus,
): void {
    player.upsertComponent(PlayerRequestedSpawnStatusComponent, {
        value,
    });
}

export function setPlayerRequestedServerStatus(player: Entity): void {
    player.upsertComponent(PlayerRequestedServerStatusComponent);
}

export function addPlayerButtonPressAction(
    player: Entity,
    action: ButtonPressAction,
): void {
    const playerInputComponent = player.getComponent(PlayerInputComponent);

    if (action.buttonType === ButtonType.ALL
        && action.buttonState === ButtonState.UNPRESSED) {
        cancelPlayerActions(player);
    } else {
        playerInputComponent.map.set(action.buttonType, action);
    }
}

function isPlayerValidTeamSwitch(
    registry: Registry,
    player: Entity,
    teamId: EntityId,
): boolean {
    const team = registry.getEntityById(teamId);

    let existingTeam;
    const playerTeamId = getPlayerTeamId(player);
    if (playerTeamId === null) {
        existingTeam = getTeamWithLeastPlayers(registry);
    } else {
        existingTeam = registry.getEntityById(playerTeamId);
    }

    return isTeamSwitchingAllowed(existingTeam, team);
}

export function onPlayerRequestedTeam(
    this: PluginContext,
    player: Entity,
    teamId: EntityId | null,
): void {
    const gameModeProperties = this.gameModeService.getGameModeProperties();
    if (!gameModeProperties.hasTeams) {
        return;
    }

    if (teamId !== null
        && !isPlayerValidTeamSwitch(this.registry, player, teamId)) {
        return;
    }

    setPlayerTeamId(this.registry, player, teamId);
}

export function setPlayerPoints(player: Entity, points: number): void {
    const playerComponent = player.getComponent(PlayerComponent);

    playerComponent.update({
        points,
    });
}

export function addPlayerPoints(player: Entity, event: PlayerPointsEvent): void {
    const playerComponent = player.getComponent(PlayerComponent);

    setPlayerPoints(player, playerComponent.points + PlayerPoints[event]);
}

export function setPlayerKills(player: Entity, kills: number): void {
    const playerComponent = player.getComponent(PlayerComponent);

    playerComponent.update({
        kills,
    });
}

export function addPlayerKill(player: Entity): void {
    const playerComponent = player.getComponent(PlayerComponent);

    addPlayerPoints(player, PlayerPointsEvent.KILL);
    setPlayerKills(player, playerComponent.kills + 1);
}

export function setPlayerDeaths(player: Entity, deaths: number): void {
    const playerComponent = player.getComponent(PlayerComponent);

    playerComponent.update({
        deaths,
    });
}

export function addPlayerDeath(player: Entity): void {
    const playerComponent = player.getComponent(PlayerComponent);

    addPlayerPoints(player, PlayerPointsEvent.DEATH);
    setPlayerDeaths(player, playerComponent.deaths + 1);
}

export function setPlayerRespawnTimeout(player: Entity, value: number): void {
    player.updateComponent(PlayerRespawnTimeoutComponent, {
        value,
    });
}

export function getPlayerRespawnTimeout(player: Entity): number {
    return player.getComponent(PlayerRespawnTimeoutComponent).value;
}

export function resetPlayerRespawnTimeout(player: Entity): void {
    const respawnTimeout = player
        .getComponent(PlayerRespawnTimeoutConfigComponent).value;
    setPlayerRespawnTimeout(player, respawnTimeout);
}

export function processPlayerRespawnTimeout(
    player: Entity,
    deltaSeconds: number,
): void {
    const respawnTimeout = getPlayerRespawnTimeout(player);

    const playerTankId = getPlayerTankId(player);
    if (playerTankId !== null) {
        return;
    }

    if (respawnTimeout == 0) {
        return;
    }

    let newRespawnTimeout = respawnTimeout - deltaSeconds;
    if (newRespawnTimeout < 0) {
        newRespawnTimeout = 0;
    }

    setPlayerRespawnTimeout(player, newRespawnTimeout);
}

export function processPlayerSpawnStatus(
    this: PluginContext,
    player: Entity,
): void {
    const spawnStatusComponent = player
        .findComponent(PlayerRequestedSpawnStatusComponent);
    if (spawnStatusComponent === undefined) {
        return;
    }

    const status = spawnStatusComponent.value;
    const playerTankId = getPlayerTankId(player);
    const respawnTimeout = getPlayerRespawnTimeout(player);
    let handleRequestedSpawnStatus = false;

    if (status === PlayerSpawnStatus.SPAWN
        && playerTankId === null
        && respawnTimeout == 0) {
        handleRequestedSpawnStatus = true;
    }

    if (status === PlayerSpawnStatus.DESPAWN
        && playerTankId !== null) {
        handleRequestedSpawnStatus = true;
    }

    if (!handleRequestedSpawnStatus) {
        return;
    }

    spawnStatusComponent.remove();

    if (status === PlayerSpawnStatus.SPAWN && playerTankId === null) {
        let playerTeamId = getPlayerTeamId(player);
        if (playerTeamId === null) {
            const team = getTeamWithLeastPlayers(this.registry);
            setPlayerTeamId(this.registry, player, team.id);
        }
        playerTeamId = getPlayerTeamId(player);

        const entities = this.registry.getEntitiesWithComponent(SpawnComponent);
        const position = pickRandomSpawnPosition(entities, playerTeamId);
        createTankForPlayer.call(this, player, position);
        createSpawnEffect(this.entityFactory, position);
    } else if (status === PlayerSpawnStatus.DESPAWN && playerTankId !== null) {
        const tank = this.registry.getEntityById(playerTankId);
        markDestroyed(tank);
    }
}

export function processPlayerDisconnectStatus(player: Entity): void {
    if (!player.hasComponent(PlayerRequestedDisconnectComponent)) {
        return;
    }

    markDestroyed(player);
}

function getPlayerDominantMovementDirection(
    player: Entity,
): Direction | undefined {
    const playerInputComponent = player.getComponent(PlayerInputComponent);
    let actions: ButtonPressAction[] = [];

    for (const buttonType of MOVE_BUTTON_TYPES) {
        const action = playerInputComponent.map.get(buttonType);
        if (!action) {
            continue;
        }

        actions.push(action);
    }

    actions = actions
        .filter(a => a.buttonState === ButtonState.PRESSED)
        .sort((a, b) => b.timestamp - a.timestamp);

    if (actions[0] === undefined) {
        return undefined;
    }

    return BUTTON_TYPE_DIRECTION[actions[0].buttonType];
}

export function processPlayerMovement(registry: Registry, player: Entity): void {
    const playerTankId = getPlayerTankId(player);
    if (playerTankId === null) {
        return;
    }

    const playerComponent = player.getComponent(PlayerComponent);
    const direction = getPlayerDominantMovementDirection(player);
    if (direction === playerComponent.lastRequestedDirection) {
        return;
    }

    playerComponent.update({
        lastRequestedDirection: direction,
    });


    const tank = registry.getEntityById(playerTankId);
    setMovementDirection(tank, direction);
}

function isPlayerShooting(player: Entity): boolean {
    const playerInputComponent = player.getComponent(PlayerInputComponent);
    const action = playerInputComponent.map.get(ButtonType.SHOOT);
    if (!action) {
        return false;
    }

    return action.buttonState === ButtonState.PRESSED;
}

export function processPlayerShooting(
    registry: Registry,
    player: Entity,
): void {
    const playerTankId = getPlayerTankId(player);
    if (playerTankId === null) {
        return;
    }

    const playerComponent = player.getComponent(PlayerComponent);
    const isShooting = isPlayerShooting(player);
    if (isShooting === playerComponent.isShooting) {
        return;
    }

    playerComponent.update({
        isShooting,
    });

    const tank = registry.getEntityById(playerTankId);
    setEntitySpawnerStatus(tank, BulletSpawnerComponent, isShooting);
}

export function isPlayerDroppingFlag(player: Entity): boolean {
    const playerInputComponent = player.getComponent(PlayerInputComponent);
    const action = playerInputComponent.map.get(ButtonType.DROP_FLAG);
    if (!action) {
        return false;
    }

    return action.buttonState === ButtonState.PRESSED;
}

export function processPlayerDroppingFlag(
    this: PluginContext,
    player: Entity,
): void {
    const playerTankId = getPlayerTankId(player);
    if (playerTankId === null) {
        return;
    }

    const isDroppingFlag = isPlayerDroppingFlag(player);
    if (!isDroppingFlag) {
        return;
    }

    const tank = this.registry.getEntityById(playerTankId);
    const carriedFlag = this.collisionService
        .findRelativePositionEntityWithType(tank,
            EntityType.FLAG);
    if (carriedFlag !== undefined) {
        handleFlagDrop(this.registry, tank, undefined, carriedFlag, undefined,
            FlagTankInteraction.DROP);
    }
}

export function getSortedPlayers(registry: Registry): Entity[] {
    const playersIterable = registry.getEntitiesWithComponent(PlayerComponent);
    const players = Array.from(playersIterable);
    return players.sort((first, second) => {
        const firstPlayerComponent = first.getComponent(PlayerComponent);
        const secondPlayerComponent = second.getComponent(PlayerComponent);

        return secondPlayerComponent.points - firstPlayerComponent.points;
    });
}
