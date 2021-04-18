import fs from 'fs';
import GameObject, { PartialGameObjectOptions } from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import GameObjectProperties from '@/object/GameObjectProperties';
import { GameShortObjectType } from '@/object/GameObjectType';

export interface GameMapOptions {
    resolution?: number;
    objectsFromBlocks?: string[];
    objectsFromOptions?: PartialGameObjectOptions[];
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

    setObjectsFromOptions(objectsOptions: PartialGameObjectOptions[]): void {
        this.options.objectsFromOptions = objectsOptions;
    }

    setObjectsFromBlocks(objectsFromBlocks: string[]): void {
        this.options.objectsFromBlocks = objectsFromBlocks;
    }

    getObjectsFromBlocks(): GameObject[] {
        const objects = new Array<GameObject>();
        const splitBlocks = new Array<Array<string>>();

        if (this.options.resolution === undefined
            || this.options.objectsFromBlocks === undefined) {
            return objects;
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

                const shortType = splitBlocks[mapRow][mapColumn];
                if (shortType === ' ') {
                    continue;
                }

                const properties = GameObjectProperties.getShortTypeProperties(shortType);
                for (let smallY = bigY; smallY < bigY + resolution; smallY += properties.height) {
                    for (let smallX = bigX; smallX < bigX + resolution; smallX += properties.width) {
                        const object = GameObjectFactory.buildFromShortType(shortType as GameShortObjectType, {
                            y: smallY,
                            x: smallX,
                        });

                        objects.push(object);
                    }
                }
            }
        }

        return objects;
    }

    getObjectsFromOptions(): GameObject[] {
        const objects = new Array<GameObject>();

        if (this.options.objectsFromOptions === undefined) {
            return objects;
        }

        for (const objectOptions of this.options.objectsFromOptions) {
            objects.push(
                GameObjectFactory.buildFromOptions(objectOptions),
            );
        }

        return objects;
    }

    getObjects(): GameObject[] {
        const objectsFromBlocks = this.getObjectsFromBlocks();
        const objectsFromOptions = this.getObjectsFromOptions();
        return objectsFromOptions.concat(objectsFromBlocks);
    }
}
