import GameObject from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import GameObjectProperties, { GameObjectType } from '@/object/GameObjectProperties';

export interface GameMapOptions {
    resolution: number;
    blocks: string[];
}

export default class GameMap {
    private resolution: number;
    private objects = new Array<GameObject>();
    private playerSpawnObjects = new Array<GameObject>();

    constructor(options: GameMapOptions) {
        this.resolution = options.resolution;

        this.createObjectsFromBlocks(options.blocks);
    }

    createObjectsFromBlocks(rows: string[]): void {
        let noBlocks = 0;

        const blocks = new Array<Array<string>>();
        for (const row of rows) {
            blocks.push(row.split(''));
        }

        const mapHeight = blocks.length * this.resolution;
        for (let bigY = 0; bigY < mapHeight; bigY += this.resolution) {
            const mapWidth = blocks[bigY].length * this.resolution;
            for (let bigX = 0; bigX < mapWidth; bigX += this.resolution) {
                const blockRow = bigY / this.resolution;
                const blockColumn = bigX / this.resolution;

                const shortType = blocks[blockRow][blockColumn];
                if (shortType === ' ') {
                    continue;
                }

                const properties = GameObjectProperties.getShortTypeProperties(shortType);
                for (let smallY = bigY; smallY < bigY + this.resolution; smallY += properties.height) {
                    for (let smallX = bigX; smallX < bigX + this.resolution; smallX += properties.width) {
                        const object = GameObjectFactory.buildMapObject(shortType, {
                            y: smallY,
                            x: smallX,
                        });

                        noBlocks++;

                        if (object.type === GameObjectType.PLAYER_SPAWN) {
                            this.playerSpawnObjects.push(object);
                        }

                        this.objects.push(object);
                    }
                }
            }
        }
    }

    getObjects(): GameObject[] {
        return this.objects;
    }

    getPlayerSpawnObjects(): GameObject[] {
        return this.playerSpawnObjects;
    }
}
