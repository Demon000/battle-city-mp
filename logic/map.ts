import fs from 'fs';
import { Color } from '@/drawable/Color';
import { PNG } from 'pngjs';
import { EntityBlueprint } from '@/ecs/EntityBlueprint';
import { SizeComponent } from '@/components/SizeComponent';
import { EntityBuildOptions } from '@/entity/EntityFactory';
import { Point } from '@/physics/point/Point';
import { assert } from '@/utils/assert';
import { ComponentsInitialization } from '@/ecs/Component';
import { BoundingBox } from '@/physics/bounding-box/BoundingBox';
import { PNGUtils } from '@/utils/PNGUtils';
import { FileUtils } from '@/utils/FileUtils';

export interface GameMapOptions {
    name: string;
    resolution: number;
    layerFiles?: string[];
    entitiesFromOptionsFile?: string;
    colorsEntityTypesMap?: Record<string, Color>;
    entityTypesColorsMap?: Map<number, string>;
}

export interface LegacyEntityOptions extends EntityBuildOptions {
    position?: Point;
    components?: ComponentsInitialization;
}

function getColorIndex(color: Color): number {
    return color[0] << 16 | color[1] << 8 | color[2];
}

function getColorEntityType(options: GameMapOptions, color: Color): string {
    assert(options.entityTypesColorsMap  !== undefined,
        'Cannot retrieve entity type of color when missing map');

    const colorIndex = getColorIndex(color);
    const type = options.entityTypesColorsMap.get(colorIndex);
    assert(type !== undefined,
        `Cannot retrieve entity type for invalid color '${color}'`);

    return type;
}

function getEntityFromLegacyOptions(
    options: LegacyEntityOptions,
): EntityBuildOptions {
    const components: ComponentsInitialization = {};

    if (options.position) {
        components['PositionComponent'] = options.position;
    }

    if (options.components !== undefined) {
        Object.assign(components, options.components);
    }

    return {
        type: options.type,
        id: options.id,
        subtypes: options.subtypes,
        components,
    };
}

function getEntitiesOptionsFromOptions(
    options: GameMapOptions,
): EntityBuildOptions[] {
    if (options.entitiesFromOptionsFile === undefined) {
        return [];
    }

    const filePath = getMapFilePath(options.name,
        options.entitiesFromOptionsFile);

    return FileUtils.readJSON5(filePath).map(getEntityFromLegacyOptions);
}

function getMapFilePath(name: string, fileName: string): string {
    return `./configs/maps/${name}/${fileName}`;
}

function fillAreaWithDynamicSizeType(
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

function fillAreaWithFixedSizeType(
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

function fillAreaWithType(
    entityBlueprint: EntityBlueprint,
    entitiesOptionsComponents: EntityBuildOptions[],
    box: BoundingBox,
    type: string,
): void {
    const size = entityBlueprint
        .findTypeComponentData(type, 'SizeComponent') as SizeComponent;
    const dynamicSize = entityBlueprint
        .findTypeComponentData(type, 'DynamicSizeComponent');

    if (dynamicSize === undefined) {
        fillAreaWithFixedSizeType(entitiesOptionsComponents, box, type, size);
    } else {
        fillAreaWithDynamicSizeType(entitiesOptionsComponents, box, type);
    }
}

function getEntitiesOptionsFromLayers(
    entityBlueprint: EntityBlueprint,
    options: GameMapOptions,
): EntityBuildOptions[] {
    const entitiesOptionsComponents: EntityBuildOptions[] = [];

    if (options.layerFiles === undefined
        || options.colorsEntityTypesMap === undefined) {
        return entitiesOptionsComponents;
    }

    const resolution = options.resolution;
    for (const layerFile of options.layerFiles) {
        const layerPath = getMapFilePath(options.name, layerFile);
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

                const type = getColorEntityType(options, color);
                fillAreaWithType(entityBlueprint, entitiesOptionsComponents,
                    box, type);

                PNGUtils.setRectangleColor(png, rec, [0, 0, 0]);
            }
        }
    }

    return entitiesOptionsComponents;
}

function getEntitiesOptions(
    entityBlueprint: EntityBlueprint,
    options: GameMapOptions,
): EntityBuildOptions[] {
    let entityBuildOptions: EntityBuildOptions[] = [];

    const entitiesOptionsFromOptions = getEntitiesOptionsFromOptions(options);
    entityBuildOptions = entityBuildOptions.concat(entitiesOptionsFromOptions);

    const entitiesOptionsFromLayers = getEntitiesOptionsFromLayers(
        entityBlueprint, options);
    entityBuildOptions = entityBuildOptions.concat(entitiesOptionsFromLayers);

    return entityBuildOptions;
}

export function getMapOptions(name: string): GameMapOptions {
    const metaPath = getMapFilePath(name, 'meta.json5');
    const options = FileUtils.readJSON5(metaPath) as GameMapOptions;

    if (options.colorsEntityTypesMap !== undefined) {
        options.entityTypesColorsMap = new Map();

        for (const [type, color] of Object.entries(options.colorsEntityTypesMap)) {
            const colorIndex = getColorIndex(color);
            options.entityTypesColorsMap.set(colorIndex, type);
        }
    }

    return options;
}

export function getMapEntitiesOptions(
    entityBlueprint: EntityBlueprint,
    name: string,
): EntityBuildOptions[] {
    const options = getMapOptions(name);

    return getEntitiesOptions(entityBlueprint, options);
}
