import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { Config } from '@/config/Config';
import { Registry } from '@/ecs/Registry';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { Tank } from '@/tank/Tank';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { Flag, FlagOptions, FlagType, PartialFlagOptions } from './Flag';

export enum FlagServiceEvent {
    FLAG_UPDATED = 'flag-updated',
}

export interface FlagServiceEvents {
    [FlagServiceEvent.FLAG_UPDATED]: (flagId: number, options: PartialFlagOptions) => void,
}

export enum FlagTankInteraction {
    STEAL,
    PICK,
    CAPTURE,
    RETURN,
    DROP,
}

export class FlagService {
    emitter = new EventEmitter<FlagServiceEvents>();

    constructor(
        private gameObjectFactory: GameObjectFactory,
        private registry: Registry,
        private config: Config,
    ) {}

    createFlagForTank(tank: Tank): Flag {
        assert(tank.flagTeamId !== null);
        assert(tank.flagColor !== null);

        const position = tank.getComponent(PositionComponent);
        return this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.FLAG,
            options: {
                teamId: tank.flagTeamId,
                flagType: FlagType.POLE_ONLY,
                sourceId: tank.flagSourceId,
                droppedTankId: tank.id,
            } as FlagOptions,
            components: {
                PositionComponent: position,
                ColorComponent: {
                    value: tank.flagColor,
                },
            },
        }) as Flag;
    }

    setFlagType(flagId: number, type: FlagType): void {
        const flag = this.registry.getEntityById(flagId) as Flag;
        flag.flagType  = type;

        this.emitter.emit(FlagServiceEvent.FLAG_UPDATED, flagId, {
            flagType: type,
        });
    }

    getFlagTankInteractionType(flag: Flag, tank: Tank): FlagTankInteraction | undefined {
        const flagTeamId = flag.getComponent(TeamOwnedComponent).teamId;
        const tankTeamId = tank.getComponent(TeamOwnedComponent).teamId;
        let interaction;

        if (tank.flagTeamId === null) {
            if (tankTeamId !== flagTeamId && flag.flagType === FlagType.FULL) {
                interaction = FlagTankInteraction.STEAL;
            } else if (flag.flagType === FlagType.POLE_ONLY) {
                interaction = FlagTankInteraction.PICK;
            }
        }

        if (tank.flagTeamId !== null && tankTeamId === flagTeamId) {
            if (tank.flagTeamId === tankTeamId && flag.flagType === FlagType.BASE_ONLY) {
                interaction = FlagTankInteraction.RETURN;
            } else if (tank.flagTeamId !== tankTeamId && flag.flagType === FlagType.FULL) {
                interaction = FlagTankInteraction.CAPTURE;
            }
        }

        const pickupIgnoreTime = this.config.get<number>('flag', 'pickupIgnoreTime');
        const spawnTime = flag.getComponent(SpawnTimeComponent).value;
        if (flag.droppedTankId === tank.id
            && spawnTime + pickupIgnoreTime >= Date.now()) {
            interaction = undefined;
        }

        return interaction;
    }
}
