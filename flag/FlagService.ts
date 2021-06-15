import { GameObject } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { Tank } from '@/tank/Tank';
import { MapRepository } from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { Flag, FlagType, PartialFlagOptions } from './Flag';

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
}

export class FlagService {
    private repository;
    emitter = new EventEmitter<FlagServiceEvents>();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
    }

    createFlagForTank(tank: Tank): Flag | null {
        if (tank.flagTeamId === null || tank.flagColor === null) {
            return null;
        }

        return new Flag({
            position: tank.position,
            teamId: tank.flagTeamId,
            color: tank.flagColor,
            flagType: FlagType.POLE_ONLY,
            sourceId: tank.flagSourceId,
        });
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

    getFlagTankInteractionType(flag: Flag, tank: Tank): FlagTankInteraction | null {
        if (tank.flagTeamId === null) {
            if (tank.teamId !== flag.teamId && flag.flagType === FlagType.FULL) {
                return FlagTankInteraction.STEAL;
            } else if (flag.flagType === FlagType.POLE_ONLY) {
                return FlagTankInteraction.PICK;
            }
        }

        if (tank.flagTeamId !== null && tank.teamId === flag.teamId) {
            if (tank.flagTeamId === tank.teamId && flag.flagType === FlagType.BASE_ONLY) {
                return FlagTankInteraction.RETURN;
            } else if (tank.flagTeamId !== tank.teamId && flag.flagType === FlagType.FULL) {
                return FlagTankInteraction.CAPTURE;
            }
        }

        return null;
    }
}
