import { Registry } from '@/ecs/Registry';
import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';

export enum FlagType {
    FULL = 'full',
    BASE_ONLY = 'base-only',
    POLE_ONLY = 'pole-only',
}

export interface FlagOptions extends GameObjectOptions {
    flagType?: string;
    sourceId?: number;
    droppedTankId?: number;
}

export type PartialFlagOptions = Partial<FlagOptions>;

export class Flag extends GameObject {
    protected _flagType: string;

    sourceId: number | null;
    droppedTankId: number | null;

    constructor(options: FlagOptions, properties: GameObjectProperties, registry: Registry) {
        options.type = GameObjectType.FLAG;

        super(options, properties, registry);

        this._flagType = options.flagType ?? FlagType.FULL;
        this.sourceId = options.sourceId ?? null;
        this.droppedTankId = options.droppedTankId ?? null;
    }

    toOptions(): FlagOptions {
        return {
            ...super.toOptions(),
            flagType: this._flagType,
        };
    }

    setOptions(options: PartialFlagOptions): void {
        super.setOptions(options);

        if (options.flagType !== undefined) this.flagType = options.flagType;
    }

    get flagType(): string {
        return this._flagType;
    }

    set flagType(type: string) {
        this._flagType = type;
        this.markGraphicsDirty();
    }
}
