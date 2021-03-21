import EventEmitter from 'eventemitter3';
import fs from 'fs';
import GameObjectFactory from '../object/GameObjectFactory';
import GameObjectProperties, { GameObjectType } from '../object/GameObjectProperties';
import Random from '../utils/Random';
import GameMapData from './IGameMap';

export enum GameMapServiceEvent {
    OBJECT_SPAWNED = 'object-spawned',
}

export default class GameMapService {
    private playerSpawnObjectIds = new Array<number>();
    emitter = new EventEmitter();

    loadFromFile(path: string): void {
        const fileBuffer = fs.readFileSync(path);
        const fileData = fileBuffer.toString();
        const mapData = JSON.parse(fileData) as GameMapData;

        const resolution = mapData.resolution;
        const blocks = new Array<Array<string>>();

        for (const rowString of mapData.blocks) {
            blocks.push(rowString.split(''));
        }

        const mapWidth = blocks.length * resolution;
        const mapHeight = blocks[0].length * resolution;
        let noBlocks = 0;
        for (let blockY = 0; blockY < mapHeight; blockY += resolution) {
            for (let blockX = 0; blockX < mapWidth; blockX += resolution) {
                const blockRow = blockY / resolution;
                const blockColumn = blockX / resolution;

                const shortType = blocks[blockRow][blockColumn];
                if (shortType === ' ') {
                    continue;
                }

                const properties = GameObjectProperties.getShortTypeProperties(shortType);
                for (let miniBlockY = blockY; miniBlockY < blockY + resolution; miniBlockY += properties.height) {
                    for (let miniBlockX = blockX; miniBlockX < blockX + resolution; miniBlockX += properties.width) {
                        const object = GameObjectFactory.buildMapObject(shortType, {
                            y: miniBlockY,
                            x: miniBlockX,
                        });

                        noBlocks++;

                        if (object.type === GameObjectType.PLAYER_SPAWN) {
                            this.playerSpawnObjectIds.push(object.id);
                        }
        
                        this.emitter.emit(GameMapServiceEvent.OBJECT_SPAWNED, object);
                    }
                }
            }
        }

        console.log(`Loaded map from ${path} with ${noBlocks} blocks`);
    }

    getPlayerSpawnObjectIds(): number[] {
        return this.playerSpawnObjectIds;
    }

    getRandomPlayerSpawnObjectId(): number {
        return Random.getRandomArrayElement(this.playerSpawnObjectIds);
    } 
}
