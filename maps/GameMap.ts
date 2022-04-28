import fs from 'fs';
import { isGameObjectType } from '@/object/GameObjectType';
import { Team, TeamOptions } from '@/team/Team';
import { Config } from '@/config/Config';
import { Color } from '@/drawable/Color';
import { PNG } from 'pngjs';
import JSON5 from 'json5';
import { EntityBlueprint } from '@/ecs/EntityBlueprint';
import { SizeComponent } from '@/components/SizeComponent';
import { GameObjectFactoryBuildOptions } from '@/object/GameObjectFactory';
import { Point } from '@/physics/point/Point';
import { assert } from '@/utils/assert';
import { ComponentsInitialization } from '@/ecs/Component';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { PNGUtils } from '@/utils/PNGUtils';

export interface GameMapOptions {
    name: string;
    resolution: number;
    layerFiles?: string[];
    objectsFromOptionsFile?: string;
    colorsObjectTypesMap?: Record<string, Color>;
    objectTypesColorsMap?: Map<number, string>;
    teamsOptions?: TeamOptions[];
}

export interface LegacyGameObjectOptions extends GameObjectFactoryBuildOptions {
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

        if (this.options.colorsObjectTypesMap !== undefined) {
            this.options.objectTypesColorsMap = new Map();

            for (const [type, color] of Object.entries(this.options.colorsObjectTypesMap)) {
                if (!isGameObjectType(type)) {
                    console.log(`Invalid game object type: ${type}`);
                }

                const colorIndex = this.getColorIndex(color);
                this.options.objectTypesColorsMap.set(colorIndex, type);
            }
        }
    }

    getColorIndex(color: Color): number {
        return color[0] << 16 | color[1] << 8 | color[2];
    }

    getColorGameObjectType(color: Color): string {
        assert(this.options.objectTypesColorsMap  !== undefined,
            'Cannot retrieve game object type of color when missing map');

        const colorIndex = this.getColorIndex(color);
        const type = this.options.objectTypesColorsMap.get(colorIndex);
        assert(type !== undefined,
            `Cannot retrieve game object type for invalid color '${color}'`);

        return type;
    }

    getObjectsOptionsFromOptions(): GameObjectFactoryBuildOptions[] {
        if (this.options.objectsFromOptionsFile === undefined) {
            return [];
        }

        const filePath = this.getMapFilePath(this.options.objectsFromOptionsFile);
        const fileData = fs.readFileSync(filePath, 'utf8');
        const data = JSON5.parse(fileData).map(
            (options: LegacyGameObjectOptions) => {
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
        objectsOptionsComponents: GameObjectFactoryBuildOptions[],
        box: BoundingBox,
        type: string,
    ): void {
        objectsOptionsComponents.push({
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
        objectsOptionsComponents: GameObjectFactoryBuildOptions[],
        box: BoundingBox,
        type: string,
        size: SizeComponent,
    ): void {
        for (let y = box.tl.y; y < box.br.y; y += size.height) {
            for (let x = box.tl.x; x < box.br.x; x += size.width) {
                objectsOptionsComponents.push({
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
        objectsOptionsComponents: GameObjectFactoryBuildOptions[],
        box: BoundingBox,
        type: string,
    ): void {
        const size = this.entityBlueprint
            .findTypeComponentData(type, 'SizeComponent') as SizeComponent;
        const dynamicSize = this.entityBlueprint
            .findTypeComponentData(type, 'DynamicSizeComponent');

        if (dynamicSize === undefined) {
            this.fillAreaWithFixedSizeType(objectsOptionsComponents, box, type, size);
        } else {
            this.fillAreaWithDynamicSizeType(objectsOptionsComponents, box, type);
        }
    }

    getObjectsOptionsFromLayers(): GameObjectFactoryBuildOptions[] {
        const objectsOptionsComponents: GameObjectFactoryBuildOptions[] = [];

        if (this.options.layerFiles === undefined
            || this.options.colorsObjectTypesMap === undefined) {
            return objectsOptionsComponents;
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

                    const type = this.getColorGameObjectType(color);
                    this.fillAreaWithType(objectsOptionsComponents, box, type);

                    PNGUtils.setRectangleColor(png, rec, [0, 0, 0]);
                }
            }
        }

        return objectsOptionsComponents;
    }

    getObjectsOptions(): GameObjectFactoryBuildOptions[] {
        let options: GameObjectFactoryBuildOptions[] = [];

        const objectsOptionsFromOptions = this.getObjectsOptionsFromOptions();
        options = options.concat(objectsOptionsFromOptions);

        const objectsOptionsFromLayers = this.getObjectsOptionsFromLayers();
        options = options.concat(objectsOptionsFromLayers);

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
