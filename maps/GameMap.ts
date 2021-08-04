import fs from 'fs';
import { GameObjectOptions } from '@/object/GameObject';
import { GameObjectProperties } from '@/object/GameObjectProperties';
import { GameObjectType, isGameObjectType } from '@/object/GameObjectType';
import { Team, TeamOptions } from '@/team/Team';
import { Config } from '@/config/Config';
import { Color } from '@/drawable/Color';
import { PNG } from 'pngjs';
import JSON5 from 'json5';

export interface GameMapOptions {
    name: string;
    resolution: number;
    layerFiles?: string[];
    objectsFromOptionsFile?: string;
    colorsObjectTypesMap?: Record<string, Color>;
    objectTypesColorsMap?: Map<number, string>;
    teamsOptions?: TeamOptions[];
}

export class GameMap {
    options: GameMapOptions;

    constructor(
        private name: string,
        private config: Config,
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

    getColorGameObjectType(color: Color): GameObjectType {
        if (this.options.objectTypesColorsMap  === undefined) {
            throw new Error('Cannot retrieve game object type of color when missing map');
        }

        const colorIndex = this.getColorIndex(color);
        const type = this.options.objectTypesColorsMap.get(colorIndex);
        if (type === undefined) {
            throw new Error(`Cannot retrieve game object type for invalid color: ${color}`);
        }

        return type as GameObjectType;
    }

    getTypeObjectProperties(type: GameObjectType): GameObjectProperties {
        const gameObjectsProperties = this.config
            .getData<Record<GameObjectType, GameObjectProperties>>
            ('game-object-properties');

        const gameObjectProperties = gameObjectsProperties[type];
        if (gameObjectsProperties === undefined) {
            throw new Error(`Cannot get properties of invalid object type: ${type}`);
        }

        return gameObjectProperties;
    }

    getObjectsOptionsFromOptions(): GameObjectOptions[] {
        if (this.options.objectsFromOptionsFile === undefined) {
            return [];
        }

        const filePath = this.getMapFilePath(this.options.objectsFromOptionsFile);
        const fileData = fs.readFileSync(filePath, 'utf8');
        const data = JSON5.parse(fileData);
        return data;
    }

    getMapFilePath(fileName: string): string {
        return `./configs/maps/${this.name}/${fileName}`;
    }

    getObjectsOptionsFromLayers(): GameObjectOptions[] {
        const objectsOptions: GameObjectOptions[] = [];

        if (this.options.layerFiles === undefined
            || this.options.colorsObjectTypesMap === undefined) {
            return objectsOptions;
        }

        const resolution = this.options.resolution;
        for (const layerFile of this.options.layerFiles) {
            const layerPath = this.getMapFilePath(layerFile);
            const data = fs.readFileSync(layerPath);
            const png = PNG.sync.read(data);

            for (let pngY = 0; pngY < png.height; pngY++) {
                for (let pngX = 0; pngX < png.width; pngX++) {
                    const id = (png.width * pngY + pngX) << 2;
                    const r = png.data[id];
                    const g = png.data[id + 1];
                    const b = png.data[id + 2];
                    if (r === 0 && g === 0 && b === 0) {
                        continue;
                    }

                    const bigX = pngX * this.options.resolution;
                    const bigY = pngY * this.options.resolution;
                    const type = this.getColorGameObjectType([r, g, b]);
                    const properties = this.getTypeObjectProperties(type);

                    for (
                        let smallY = bigY;
                        smallY < bigY + resolution;
                        smallY += properties.height
                    ) {
                        for (
                            let smallX = bigX;
                            smallX < bigX + resolution;
                            smallX += properties.width
                        ) {
                            objectsOptions.push({
                                type,
                                position: {
                                    y: smallY,
                                    x: smallX,
                                },
                            });
                        }
                    }
                }
            }
        }

        return objectsOptions;
    }

    getObjectsOptions(): GameObjectOptions[] {
        let objectsOptions: GameObjectOptions[] = [];

        const objectsOptionsFromOptions = this.getObjectsOptionsFromOptions();
        objectsOptions = objectsOptions.concat(objectsOptionsFromOptions);

        const objectsOptionsFromLayers = this.getObjectsOptionsFromLayers();
        objectsOptions = objectsOptions.concat(objectsOptionsFromLayers);

        return objectsOptions;
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
