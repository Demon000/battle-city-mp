import { FlagComponent } from '@/components/FlagComponent';
import { PickupIgnoreComponent } from '@/components/PickupIgnoreComponent';
import { PickupIgnoreTimeComponent } from '@/components/PickupIgnoreTimeComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { PlayerPointsEvent } from '@/player/PlayerPoints';
import { PlayerService } from '@/player/PlayerService';
import { assert } from '@/utils/assert';
import { attachRelativeEntity, isAttachedRelativeEntity, setEntityPosition, unattachRelativeEntity } from './entity';

export enum FlagTankInteraction {
    PICK,
    CAPTURE,
    RETURN,
    DROP,
}

function setFlagSource(
    flag: Entity,
    flagBase: Entity | undefined,
): void {
    const flagComponent = flag.getComponent(FlagComponent);

    if (flagBase === undefined || flagComponent.sourceId !== -1) {
        return;
    }

    flagComponent.update({
        sourceId: flagBase.id,
    });
}

function setFlagDropper(
    flag: Entity,
    tank: Entity,
): void {
    const pickUpIgnoreComponent = flag.getComponent(PickupIgnoreComponent);

    pickUpIgnoreComponent.update({
        entityId: tank.id,
        time: Date.now(),
    });
}

function findFlagTankInteractionType(
    tank: Entity,
    flag?: Entity,
    carriedFlag?: Entity,
    flagBase?: Entity,
): FlagTankInteraction | undefined {
    const tankTeamId = tank
        .getComponent(TeamOwnedComponent).teamId;
    const flagTeamId = flag
        ?.getComponent(TeamOwnedComponent).teamId;
    const carriedFlagTeamId = carriedFlag
        ?.getComponent(TeamOwnedComponent).teamId;
    const flagBaseTeamId = flagBase
        ?.getComponent(TeamOwnedComponent).teamId;

    /*
     * Pick up flag. Must not be carrying a flag. If the flag is from the
     * same team as the tank, then the flag must not be on its base.
     */
    if (carriedFlag === undefined && flag !== undefined) {
        let interaction;

        if (flagBase === undefined && flagTeamId === tankTeamId) {
            interaction = FlagTankInteraction.PICK;
        } else if (flagTeamId !== tankTeamId) {
            interaction = FlagTankInteraction.PICK;
        }

        if (interaction !== undefined) {
            const pickupIgnoreTime = flag
                .getComponent(PickupIgnoreTimeComponent).value;
            const pickupIgnoreComponent = flag
                .getComponent(PickupIgnoreComponent);
            if (pickupIgnoreComponent.entityId === tank.id
                && pickupIgnoreComponent.time + pickupIgnoreTime
                    >= Date.now()) {
                interaction = undefined;
            }
        }

        if (interaction !== undefined) {
            return interaction;
        }
    }

    /*
     * Return flag to its base. Must be carrying a flag from the same team
     * as the tank.
     */
    if (carriedFlag !== undefined && flag === undefined
        && flagBase !== undefined && tankTeamId === carriedFlagTeamId
        && flagBaseTeamId == carriedFlagTeamId) {
        return FlagTankInteraction.RETURN;
    }

    /*
     * Capture flag. Must be carrying a flag from another team and the flag
     * of the tank's team must be on its base.
     */
    if (carriedFlag !== undefined && flag !== undefined
        && flagBase !== undefined && carriedFlagTeamId !== flagTeamId
        && flagTeamId === flagBaseTeamId && tankTeamId === flagBaseTeamId) {
        return FlagTankInteraction.CAPTURE;
    }

    return undefined;
}

function handleFlagPick(
    registry: Registry,
    tank: Entity,
    flag: Entity,
    flagBase: Entity | undefined,
): void {
    if (isAttachedRelativeEntity(flag)) {
        return;
    }

    attachRelativeEntity(registry, tank, flag);
    setFlagSource(flag, flagBase);
}

export function handleFlagDrop(
    registry: Registry,
    playerService: PlayerService,
    tank: Entity,
    flag: Entity | undefined,
    carriedFlag: Entity,
    flagBase: Entity | undefined,
    interaction: FlagTankInteraction,
): void {
    const playerId = tank.getComponent(PlayerOwnedComponent).playerId;
    let position;

    if (interaction === FlagTankInteraction.DROP) {
        position = tank.getComponent(PositionComponent);
    } else if (interaction === FlagTankInteraction.RETURN) {
        assert(flagBase !== undefined);

        position = flagBase.getComponent(PositionComponent);
    } else if (interaction === FlagTankInteraction.CAPTURE) {
        assert(flag !== undefined);
        assert(carriedFlag !== undefined);

        const flagComponent = carriedFlag.getComponent(FlagComponent);
        const carriedFlagBase = registry.getEntityById(flagComponent.sourceId);
        position = carriedFlagBase.getComponent(PositionComponent);
    } else {
        assert(false);
    }

    unattachRelativeEntity(registry, carriedFlag);
    setEntityPosition(carriedFlag, position);
    setFlagDropper(carriedFlag, tank);

    if (interaction === FlagTankInteraction.RETURN) {
        playerService.addPlayerPoints(playerId,
            PlayerPointsEvent.RETURN_FLAG);
    } else if (interaction === FlagTankInteraction.CAPTURE) {
        playerService.addPlayerPoints(playerId,
            PlayerPointsEvent.CAPTURE_FLAG);
    }
}

export function handleFlagInteraction(
    registry: Registry,
    playerService: PlayerService,
    tank: Entity,
    flag: Entity | undefined,
    carriedFlag: Entity | undefined,
    flagBase: Entity | undefined,
): void {
    const interaction = findFlagTankInteractionType(tank, flag,
        carriedFlag, flagBase);
    if (interaction === undefined) {
        return;
    }

    if (interaction === FlagTankInteraction.PICK) {
        assert(flag !== undefined);
        handleFlagPick(registry, tank, flag, flagBase);
    } else if (interaction === FlagTankInteraction.DROP
        || interaction === FlagTankInteraction.RETURN
        || interaction === FlagTankInteraction.CAPTURE) {
        assert(carriedFlag !== undefined);
        handleFlagDrop(registry, playerService,
            tank, flag, carriedFlag, flagBase, interaction);
    }
}
