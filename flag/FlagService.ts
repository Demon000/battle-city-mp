import { PickupIgnoreComponent } from '@/components/PickupIgnoreComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { Config } from '@/config/Config';
import { Entity } from '@/ecs/Entity';
import { FlagComponent } from './FlagComponent';

export enum FlagTankInteraction {
    PICK,
    CAPTURE,
    RETURN,
    DROP,
}

export class FlagService {
    constructor(
        private config: Config,
    ) {}

    setFlagSource(
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

    setFlagDropper(
        flag: Entity,
        tank: Entity,
    ): void {
        const pickUpIgnoreComponent = flag.getComponent(PickupIgnoreComponent);

        pickUpIgnoreComponent.update({
            entityId: tank.id,
            time: Date.now(),
        });
    }

    findFlagTankInteractionType(
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
                const pickupIgnoreTime = this.config
                    .get<number>('flag', 'pickupIgnoreTime');
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
            && flagBase !== undefined && tankTeamId === carriedFlagTeamId) {
            return FlagTankInteraction.RETURN;
        }

        /*
         * Capture flag. Must be carrying a flag from another team and the flag
         * of the tank's team must be on its base.
         */
        if (carriedFlag !== undefined && flag !== undefined
            && flagBase !== undefined && carriedFlagTeamId !== flagTeamId
            && flagTeamId === flagBaseTeamId) {
            return FlagTankInteraction.CAPTURE;
        }

        /*
         * Drop flag. Must not be at enemies base.
         */
        if (carriedFlag !== undefined && flagBase === undefined) {
            return FlagTankInteraction.DROP;
        }

        return undefined;
    }
}
