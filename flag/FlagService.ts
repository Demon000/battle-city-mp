import { ColorComponent } from '@/components/ColorComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { Config } from '@/config/Config';
import { Entity } from '@/ecs/Entity';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { Point } from '@/physics/point/Point';
import { FlagComponent } from './FlagComponent';
import { FlagType } from './FlagType';

export enum FlagTankInteraction {
    PICK,
    CAPTURE,
    RETURN,
    DROP,
}

export class FlagService {
    constructor(
        private gameObjectFactory: GameObjectFactory,
        private config: Config,
    ) {}

    createCarriedFlagFromDropped(
        flag: Entity,
        flagBase: Entity | undefined,
    ): Entity {
        const teamOwnedComponent = flag.getComponent(TeamOwnedComponent);
        const colorComponent = flag.getComponent(ColorComponent);
        const flagComponent = flag.getComponent(FlagComponent);

        if (flagBase !== undefined && flagComponent.sourceId === -1) {
            flagComponent.sourceId = flagBase.id;
        }

        return this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.FLAG,
            subtypes: [FlagType.CARRIED],
            components: {
                TeamOwnedComponent: teamOwnedComponent,
                ColorComponent: colorComponent,
                FlagComponent: flagComponent,
            },
        });
    }

    createDroppedFlagFromCarried(
        tank: Entity,
        flag: Entity,
        position: Point,
    ): Entity {
        const teamOwnedComponent = flag.getComponent(TeamOwnedComponent);
        const colorComponent = flag.getComponent(ColorComponent);
        const flagComponent = flag.getComponent(FlagComponent);
        flagComponent.droppedTankId = tank.id;
        return this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.FLAG,
            subtypes: [FlagType.DROPPED],
            components: {
                TeamOwnedComponent: teamOwnedComponent,
                ColorComponent: colorComponent,
                FlagComponent: flagComponent,
                PositionComponent: position,
            },
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
                const flagComponent = flag.getComponent(FlagComponent);
                const spawnTime = flag.getComponent(SpawnTimeComponent).value;
                if (flagComponent.droppedTankId === tank.id
                    && spawnTime + pickupIgnoreTime >= Date.now()) {
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
