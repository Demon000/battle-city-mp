import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { Config } from '@/config/Config';
import { GameObject } from '@/object/GameObject';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { Tank } from '@/tank/Tank';
import { MapRepository } from '@/utils/MapRepository';
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
        private repository: MapRepository<number, GameObject>,
        private gameObjectFactory: GameObjectFactory,
        private config: Config,
    ) {}

    createFlagForTank(tank: Tank): Flag | undefined {
        if (tank.flagTeamId === null || tank.flagColor === null) {
            return undefined;
        }

        return this.gameObjectFactory.buildFromOptions({
            type: GameObjectType.FLAG,
            position: tank.position,
            teamId: tank.flagTeamId,
            color: tank.flagColor,
            flagType: FlagType.POLE_ONLY,
            sourceId: tank.flagSourceId,
            droppedTankId: tank.id,
        } as FlagOptions) as Flag;
    }

    getFlag(flagId: number): Flag {
        const object = this.repository.get(flagId);
        if (object.type !== GameObjectType.FLAG) {
            throw new Error('Game object type is not flag');
        }

        return object as Flag;
    }

    setFlagType(flagId: number, type: FlagType): void {
        const flag = this.getFlag(flagId);
        flag.flagType  = type;

        this.emitter.emit(FlagServiceEvent.FLAG_UPDATED, flagId, {
            flagType: type,
        });
    }

    getFlagTankInteractionType(flag: Flag, tank: Tank): FlagTankInteraction | undefined {
        let interaction;

        if (tank.flagTeamId === null) {
            if (tank.teamId !== flag.teamId && flag.flagType === FlagType.FULL) {
                interaction = FlagTankInteraction.STEAL;
            } else if (flag.flagType === FlagType.POLE_ONLY) {
                interaction = FlagTankInteraction.PICK;
            }
        }

        if (tank.flagTeamId !== null && tank.teamId === flag.teamId) {
            if (tank.flagTeamId === tank.teamId && flag.flagType === FlagType.BASE_ONLY) {
                interaction = FlagTankInteraction.RETURN;
            } else if (tank.flagTeamId !== tank.teamId && flag.flagType === FlagType.FULL) {
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
