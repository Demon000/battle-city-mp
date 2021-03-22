import GameObject from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import GameObjectProperties, { GameObjectType } from '@/object/GameObjectProperties';

export interface GameMapOptions {
    resolution: number;
    blocks: string[];
    objectTypes: string[];
}

export default class GameMap {
    private resolution: number;
    private blocks = new Array<Array<string>>();

    constructor(options: GameMapOptions) {
        this.resolution = options.resolution;

        for (const row of options.blocks) {
            this.blocks.push(row.split(''));
        }
    }

    getObjects(): GameObject[] {
        const objects = new Array<GameObject>();

        const mapHeight = this.blocks.length * this.resolution;
        for (let bigY = 0; bigY < mapHeight; bigY += this.resolution) {
            const mapRow = bigY / this.resolution;
            const mapWidth = this.blocks[mapRow].length * this.resolution;
            for (let bigX = 0; bigX < mapWidth; bigX += this.resolution) {
                const mapColumn = bigX / this.resolution;

                const shortType = this.blocks[mapRow][mapColumn];
                if (shortType === ' ') {
                    continue;
                }

                const properties = GameObjectProperties.getShortTypeProperties(shortType);
                for (let smallY = bigY; smallY < bigY + this.resolution; smallY += properties.height) {
                    for (let smallX = bigX; smallX < bigX + this.resolution; smallX += properties.width) {
                        const object = GameObjectFactory.buildFromShortType(shortType, {
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
}
