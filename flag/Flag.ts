import { Color } from '@/drawable/Color';
import { GameObject, GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType } from '@/object/GameObjectType';

export enum FlagType {
    FULL = 'full',
    BASE_ONLY = 'base-only',
    POLE_ONLY = 'pole-only',
}

export interface FlagOptions extends GameObjectOptions {
    teamId: string;
    color: Color;
    flagType?: FlagType;
    sourceId?: number;
    droppedTankId?: number;
}

export type PartialFlagOptions = Partial<FlagOptions>;

export class Flag extends GameObject {
    protected _flagType: FlagType;

    teamId: string;
    color: Color;
    sourceId: number | null;
    droppedTankId: number | null;

    constructor(options: FlagOptions, properties: GameObjectProperties) {
        options.type = GameObjectType.FLAG;

        super(options, properties);

        this.teamId = options.teamId;
        this.color = options.color ?? [255, 255, 255] as Color;
        this._flagType = options.flagType ?? FlagType.FULL;
        this.sourceId = options.sourceId ?? null;
        this.droppedTankId = options.droppedTankId ?? null;
    }

    toOptions(): FlagOptions {
        const gameObjectOptions = super.toOptions();
        return Object.assign(gameObjectOptions, {
            teamId: this.teamId,
            color: this.color,
            flagType: this._flagType,
        });
    }

    setOptions(options: PartialFlagOptions): void {
        super.setOptions(options);

        if (options.teamId !== undefined) this.teamId = options.teamId;
        if (options.color !== undefined) this.color = options.color;
        if (options.flagType !== undefined) this.flagType = options.flagType;
    }

    get flagType(): FlagType {
        return this._flagType;
    }

    set flagType(type: FlagType) {
        this._flagType = type;
        this.markGraphicsDirty();
    }
}
