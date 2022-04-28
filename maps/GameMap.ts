import fs from 'fs';
import { Team, TeamOptions } from '@/team/Team';
import { Config } from '@/config/Config';
import { Color } from '@/drawable/Color';
import { PNG } from 'pngjs';
import JSON5 from 'json5';
import { EntityBlueprint } from '@/ecs/EntityBlueprint';
import { SizeComponent } from '@/components/SizeComponent';
import { EntityBuildOptions } from '@/entity/EntityFactory';
import { Point } from '@/physics/point/Point';
import { assert } from '@/utils/assert';
import { ComponentsInitialization } from '@/ecs/Component';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { PNGUtils } from '@/utils/PNGUtils';

export interface GameMapOptions {
    name: string;
    resolution: number;
    layerFiles?: string[];
    entitiesFromOptionsFile?: string;
    colorsEntityTypesMap?: Record<string, Color>;
    entityTypesColorsMap?: Map<number, string>;
    teamsOptions?: TeamOptions[];
}

export interface LegacyEntityOptions extends EntityBuildOptions {
    position: Point;
    components?: ComponentsInitialization;
}

export class GameMap {
    options: GameMapOptions;

    constructor(
        private name: string,
        private config: Config,
        private entityBlueprint: EntityBlueprint,
    ) {
        this.name = name;
        this.options = this.config.get('maps', name);

        if (this.options.colorsEntityTypesMap !== undefined) {
            this.options.entityTypesColorsMap = new Map();

            for (const [type, color] of Object.entries(this.options.colorsEntityTypesMap)) {
                const colorIndex = this.getColorIndex(color);
                this.options.entityTypesColorsMap.set(colorIndex, type);
            }
        }
    }

    getColorIndex(color: Color): number {
        return color[0] << 16 | color[1] << 8 | color[2];
    }

    getColorEntityType(color: Color): string {
        assert(this.options.entityTypesColorsMap  !== undefined,
            'Cannot retrieve entity type of color when missing map');

        const colorIndex = this.getColorIndex(color);
        const type = this.options.entityTypesColorsMap.get(colorIndex);
        assert(type !== undefined,
            `Cannot retrieve entity type for invalid color '${color}'`);

        return type;
    }

    getEntitiesOptionsFromOptions(): EntityBuildOptions[] {
        if (this.options.entitiesFromOptionsFile === undefined) {
            return [];
        }

        const filePath = this.getMapFilePath(this.options.entitiesFromOptionsFile);
        const fileData = fs.readFileSync(filePath, 'utf8');
        const data = JSON5.parse(fileData).map(
            (options: LegacyEntityOptions) => {
                const components: ComponentsInitialization = {
                    PositionComponent: options.position,
                };

                if (options.components !== undefined) {
                    Object.assign(components, options.components);
                }

                return {
                    type: options.type,
                    subtypes: options.subtypes,
                    options,
                    components,
                };
            },
        );
        return data;
    }

    getMapFilePath(fileName: string): string {
        return `./configs/maps/${this.name}/${fileName}`;
    }

    fillAreaWithDynamicSizeType(
        entitiesOptionsComponents: EntityBuildOptions[],
        box: BoundingBox,
        type: string,
    ): void {
        entitiesOptionsComponents.push({
            type,
            components: {
                PositionComponent: box.tl,
                SizeComponent: {
                    width: box.br.x - box.tl.x,
                    height: box.br.y - box.tl.y,
                },
            },
        });
    }

    fillAreaWithFixedSizeType(
        entitiesOptionsComponents: EntityBuildOptions[],
        box: BoundingBox,
        type: string,
        size: SizeComponent,
    ): void {
        for (let y = box.tl.y; y < box.br.y; y += size.height) {
            for (let x = box.tl.x; x < box.br.x; x += size.width) {
                entitiesOptionsComponents.push({
                    type,
                    components: {
                        PositionComponent: {
                            x,
                            y,
                        },
                    },
                });
            }
        }
    }

    fillAreaWithType(
        entitiesOptionsComponents: EntityBuildOptions[],
        box: BoundingBox,
        type: string,
    ): void {
        const size = this.entityBlueprint
            .findTypeComponentData(type, 'SizeComponent') as SizeComponent;
        const dynamicSize = this.entityBlueprint
            .findTypeComponentData(type, 'DynamicSizeComponent');

        if (dynamicSize === undefined) {
            this.fillAreaWithFixedSizeType(entitiesOptionsComponents, box, type, size);
        } else {
            this.fillAreaWithDynamicSizeType(entitiesOptionsComponents, box, type);
        }
    }

    getEntitiesOptionsFromLayers(): EntityBuildOptions[] {
        const entitiesOptionsComponents: EntityBuildOptions[] = [];

        if (this.options.layerFiles === undefined
            || this.options.colorsEntityTypesMap === undefined) {
            return entitiesOptionsComponents;
        }

        const resolution = this.options.resolution;
        for (const layerFile of this.options.layerFiles) {
            const layerPath = this.getMapFilePath(layerFile);
            const data = fs.readFileSync(layerPath);
            const png = PNG.sync.read(data);

            for (let y = 0; y < png.height; y++) {
                for (let x = 0; x < png.width; x++) {
                    const color = PNGUtils.getPixelColor(png, x, y);
                    if (color === undefined) {
                        continue;
                    }

                    const rec = PNGUtils.findSameColorRectangle(png, color, x, y);
                    if (rec === undefined) {
                        continue;
                    }

                    const box = {
                        tl: {
                            x: rec.tl.x * resolution,
                            y: rec.tl.y * resolution,
                        },
                        br: {
                            x: rec.br.x * resolution,
                            y: rec.br.y * resolution,
                        },
                    };

                    const type = this.getColorEntityType(color);
                    this.fillAreaWithType(entitiesOptionsComponents, box, type);

                    PNGUtils.setRectangleColor(png, rec, [0, 0, 0]);
                }
            }
        }

        return entitiesOptionsComponents;
    }

    getEntitiesOptions(): EntityBuildOptions[] {
        let options: EntityBuildOptions[] = [];

        const entitiesOptionsFromOptions = this.getEntitiesOptionsFromOptions();
        options = options.concat(entitiesOptionsFromOptions);

        const entitiesOptionsFromLayers = this.getEntitiesOptionsFromLayers();
        options = options.concat(entitiesOptionsFromLayers);

        return options;
    }

    getTeamsOptions(): Team[] {
        if (this.options.teamsOptions === undefined) {
            return [];
        }

        const teams = new Array<Team>();
        for (const teamOptions of this.options.teamsOptions) {
            teams.push(new Team(teamOptions));
        }

        return teams;
    }
}
