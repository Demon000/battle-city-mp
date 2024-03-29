import { FlagComponent } from '@/components/FlagComponent';
import { PickupIgnoreComponent } from '@/components/PickupIgnoreComponent';
import { PickupIgnoreTimeComponent } from '@/components/PickupIgnoreTimeComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { Entity } from '@/ecs/Entity';
import { PlayerPointsEvent } from '@/player/PlayerPoints';
import { assert } from '@/utils/assert';
import { setEntityPosition } from './entity-position';
import { attachRelativeEntity, isAttachedRelativeEntity, unattachRelativeEntity } from './entity-relative-position';
import { addPlayerPoints } from './player';
import { PluginContext } from './plugin';

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

    if (flagBase === undefined || flagComponent.sourceId !== 'invalid') {
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
    this: PluginContext,
    tank: Entity,
    flag: Entity,
    flagBase: Entity | undefined,
): void {
    if (isAttachedRelativeEntity(flag)) {
        return;
    }

    attachRelativeEntity.call(this, tank, flag);
    setFlagSource(flag, flagBase);
}

export function handleFlagDrop(
    this: PluginContext,
    tank: Entity,
    flag: Entity | undefined,
    carriedFlag: Entity,
    flagBase: Entity | undefined,
    interaction: FlagTankInteraction,
): void {
    const playerId = tank.getComponent(PlayerOwnedComponent).playerId;
    const player = this.registry.getEntityById(playerId);
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
        const carriedFlagBase = this.registry.getEntityById(flagComponent.sourceId);
        position = carriedFlagBase.getComponent(PositionComponent);
    } else {
        assert(false);
    }

    unattachRelativeEntity.call(this, carriedFlag);
    setEntityPosition(carriedFlag, position);
    setFlagDropper(carriedFlag, tank);

    if (interaction === FlagTankInteraction.RETURN) {
        addPlayerPoints(player, PlayerPointsEvent.RETURN_FLAG);
    } else if (interaction === FlagTankInteraction.CAPTURE) {
        addPlayerPoints(player, PlayerPointsEvent.CAPTURE_FLAG);
    }
}

export function handleFlagInteraction(
    this: PluginContext,
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
        handleFlagPick.call(this, tank, flag, flagBase);
    } else if (interaction === FlagTankInteraction.DROP
        || interaction === FlagTankInteraction.RETURN
        || interaction === FlagTankInteraction.CAPTURE) {
        assert(carriedFlag !== undefined);
        handleFlagDrop.call(this, tank, flag, carriedFlag, flagBase, interaction);
    }
}
