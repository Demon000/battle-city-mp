import fs from 'fs';
import { GameObjectOptions } from '@/object/GameObject';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameShortObjectType, isGameShortObjectType } from '@/object/GameObjectType';
import Team, { TeamOptions } from '@/team/Team';

export interface GameMapOptions {
    resolution?: number;
    teamsOptions?: TeamOptions[];
    objectsFromBlocks?: string[];
    objectsFromOptions?: GameObjectOptions[];
}

export default class GameMap {
    path: string;
    options: GameMapOptions;

    constructor(path: string) {
        const fileBuffer = fs.readFileSync(path);
        const fileData = fileBuffer.toString();

        this.path = path;
        this.options = JSON.parse(fileData) as GameMapOptions;
    }

    write(path = this.path): void {
        const fileData = JSON.stringify(this.options, null, 4);
        fs.writeFileSync(path, fileData);
    }

    setObjectsFromOptions(objectsOptions: Iterable<GameObjectOptions>): void {
        this.options.objectsFromOptions = Array.from(objectsOptions);
    }

    setObjectsFromBlocks(objectsFromBlocks: string[]): void {
        this.options.objectsFromBlocks = objectsFromBlocks;
    }

    getObjectssOptionsFromBlocks(): GameObjectOptions[] {
        const objectsOptions = new Array<GameObjectOptions>();
        const splitBlocks = new Array<Array<string>>();

        if (this.options.resolution === undefined
            || this.options.objectsFromBlocks === undefined) {
            return objectsOptions;
        }

        for (const row of this.options.objectsFromBlocks) {
            splitBlocks.push(row.split(''));
        }

        const resolution = this.options.resolution;
        const mapHeight = splitBlocks.length * resolution;
        for (let bigY = 0; bigY < mapHeight; bigY += resolution) {
            const mapRow = bigY / resolution;
            const mapWidth = splitBlocks[mapRow].length * resolution;
            for (let bigX = 0; bigX < mapWidth; bigX += resolution) {
                const mapColumn = bigX / resolution;

                const shortTypeString = splitBlocks[mapRow][mapColumn];
                if (shortTypeString === ' ') {
                    continue;
                }

                if (!isGameShortObjectType(shortTypeString)) {
                    throw new Error(`Invalid short object type: ${shortTypeString}`);
                }

                const shortType = shortTypeString as GameShortObjectType;
                const properties = GameObjectProperties.getShortTypeProperties(shortType);
                for (let smallY = bigY; smallY < bigY + resolution; smallY += properties.height) {
                    for (let smallX = bigX; smallX < bigX + resolution; smallX += properties.width) {
                        objectsOptions.push({
                            type: properties.type,
                            position: {
                                y: smallY,
                                x: smallX,
                            },
                        });
                    }
                }
            }
        }

        return objectsOptions;
    }

    getObjectsOptionsFromOptions(): GameObjectOptions[] {
        return this.options.objectsFromOptions ?? [];
    }

    getObjectsOptions(): GameObjectOptions[] {
        const objectsOptionsFromBlocks = this.getObjectssOptionsFromBlocks();
        const objectsOptionsFromOptions = this.getObjectsOptionsFromOptions();
        return objectsOptionsFromOptions.concat(objectsOptionsFromBlocks);
    }

    getTeams(): Team[] | undefined {
        if (this.options.teamsOptions === undefined) {
            return undefined;
        }

        const teams = new Array<Team>();
        for (const teamOptions of this.options.teamsOptions) {
            teams.push(new Team(teamOptions));
        }

        return teams;
    }
}
