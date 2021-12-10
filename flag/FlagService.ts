import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { Config } from '@/config/Config';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { Tank } from '@/tank/Tank';
import { assert } from '@/utils/assert';
import { FlagComponent } from './FlagComponent';
import { FlagType } from './FlagType';

export enum FlagTankInteraction {
    STEAL,
    PICK,
    CAPTURE,
    RETURN,
    DROP,
}

export class FlagService {
    constructor(
        private gameObjectFactory: GameObjectFactory,
        private registry: Registry,
        private config: Config,
    ) {}

    createFlagForTank(tank: Tank): Entity {
        assert(tank.flagTeamId !== null);
        assert(tank.flagColor !== null);

        const position = tank.getComponent(PositionComponent);
        const teamComponent = tank.getComponent(TeamOwnedComponent);
        return this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.FLAG,
            components: {
                PositionComponent: position,
                TeamOwnedComponent: {
                    teamId: tank.flagTeamId,
                },
                ColorComponent: {
                    value: tank.flagColor,
                },
                FlagComponent: {
                    type: FlagType.POLE_ONLY,
                    sourceId: tank.flagSourceId,
                    droppedTankId: tank.id,
                },
            },
        });
    }

    setFlagType(flagId: number, type: FlagType): void {
        const entity = this.registry.getEntityById(flagId);
        const flagComponent = entity.getComponent(FlagComponent);

        flagComponent.update({
            type,
        });
    }

    getFlagTankInteractionType(
        flag: Entity,
        tank: Tank,
    ): FlagTankInteraction | undefined {
        const flagTeamId = flag.getComponent(TeamOwnedComponent).teamId;
        const tankTeamId = tank.getComponent(TeamOwnedComponent).teamId;
        const flagComponent = flag.getComponent(FlagComponent);
        let interaction;

        if (tank.flagTeamId === null) {
            if (tankTeamId !== flagTeamId
                && flagComponent.type === FlagType.FULL) {
                interaction = FlagTankInteraction.STEAL;
            } else if (flagComponent.type === FlagType.POLE_ONLY) {
                interaction = FlagTankInteraction.PICK;
            }
        }

        if (tank.flagTeamId !== null && tankTeamId === flagTeamId) {
            if (tank.flagTeamId === tankTeamId
                && flagComponent.type === FlagType.BASE_ONLY) {
                interaction = FlagTankInteraction.RETURN;
            } else if (tank.flagTeamId !== tankTeamId
                && flagComponent.type === FlagType.FULL) {
                interaction = FlagTankInteraction.CAPTURE;
            }
        }

        const pickupIgnoreTime = this.config
            .get<number>('flag', 'pickupIgnoreTime');
        const spawnTime = flag.getComponent(SpawnTimeComponent).value;
        if (flagComponent.droppedTankId === tank.id
            && spawnTime + pickupIgnoreTime >= Date.now()) {
            interaction = undefined;
        }

        return interaction;
    }
}
