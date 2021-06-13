import { GameObject } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { MapRepository } from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { Flag, FlagType, PartialFlagOptions } from './Flag';

export enum FlagServiceEvent {
    FLAG_UPDATED = 'flag-updated',
}

export interface FlagServiceEvents {
    [FlagServiceEvent.FLAG_UPDATED]: (flagId: number, options: PartialFlagOptions) => void,
}

export class FlagService {
    private repository;
    emitter = new EventEmitter<FlagServiceEvents>();

    constructor(repository: MapRepository<number, GameObject>) {
        this.repository = repository;
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
}
