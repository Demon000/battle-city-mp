import { Color } from '@/drawable/Color';
import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { GameObjectType } from '@/object/GameObjectType';
import { ResourceMeta } from '@/object/IGameObjectProperties';
import ObjectUtils from '@/utils/ObjectUtils';

export enum FlagType {
    FULL = 'full',
    BASE_ONLY = 'base-only',
    POLE_ONLY = 'pole-only',
}

export interface FlagOptions extends GameObjectOptions {
    teamId: string;
    color: Color;
    flagType?: FlagType;
    sourceId?: number | null;
}

export type PartialFlagOptions = Partial<FlagOptions>;

export default class Flag extends GameObject {
    protected _flagType: FlagType;

    teamId: string;
    color: Color;
    sourceId: number | null;

    constructor(options: FlagOptions) {
        options.type = GameObjectType.FLAG;

        super(options);

        this.teamId = options.teamId;
        this.color = options.color ?? [255, 255, 255] as Color;
        this._flagType = options.flagType ?? FlagType.FULL;
        this.sourceId = options.sourceId ?? null;
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
        ObjectUtils.keysAssign(this, [
            'teamId',
            'color',
            'flagType',
        ], options);
    }

    get flagType(): FlagType {
        return this._flagType;
    }

    set flagType(type: FlagType) {
        this._flagType = type;
        this.updateGraphicsMeta();
    }

    protected updateGraphicsMeta(): void {
        const metas: ResourceMeta[] = [];
        const flagType = this._flagType;

        if (flagType === FlagType.FULL
            || flagType === FlagType.BASE_ONLY) {
            metas.push({
                isFlagBase: true,
            });
        }

        if (flagType === FlagType.FULL
            || flagType === FlagType.POLE_ONLY) {
            metas.push(
                {
                    isFlagPole: true,
                },
                {
                    isFlagCloth: true,
                    color: this.color,
                },
            );
        }

        this._graphicsMeta = metas;
    }
}
