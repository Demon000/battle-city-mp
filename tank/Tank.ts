import { Color } from '@/drawable/Color';
import { Registry } from '@/ecs/Registry';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObject, GameObjectOptions } from '../object/GameObject';
import { GameObjectType } from '../object/GameObjectType';

export interface TankOptions extends GameObjectOptions {
    teamId?: string | null;
    flagTeamId?: string | null;
    flagColor?: Color | null;
    flagSourceId?: number | null;
}

export type PartialTankOptions = Partial<TankOptions>;

export class Tank extends GameObject {
    protected _flagColor: Color | null;

    teamId: string | null;
    flagTeamId: string | null;
    flagSourceId: number | null;
    properties: GameObjectProperties;

    constructor(options: TankOptions, properties: GameObjectProperties, registry: Registry) {
        options.type = GameObjectType.TANK;

        super(options, properties, registry);

        this.properties = properties;
        this.teamId = options.teamId ?? null;
        this.flagTeamId = options.flagTeamId ?? null;
        this._flagColor = options.flagColor ?? null;
        this.flagSourceId = options.flagSourceId ?? null;
    }

    toOptions(): TankOptions {
        return {
            ...super.toOptions(),
            teamId: this.teamId,
            flagColor: this.flagColor,
        };
    }

    setOptions(options: PartialTankOptions): void {
        super.setOptions(options);

        if (options.teamId !== undefined) this.teamId = options.teamId;
        if (options.flagColor !== undefined) this.flagColor = options.flagColor;
    }

    get flagColor(): Color | null {
        return this._flagColor;
    }

    set flagColor(value: Color | null) {
        this._flagColor = value;
        this.markGraphicsDirty();
    }
}
