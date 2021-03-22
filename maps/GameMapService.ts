import EventEmitter from 'eventemitter3';
import fs from 'fs';
import Random from '../utils/Random';
import GameMap, { GameMapOptions } from './GameMap';

export enum GameMapServiceEvent {
    OBJECTS_SPAWNED = 'objects-spawned',
}

export default class GameMapService {
    private playerSpawnObjectIds = new Array<number>();
    private map?: GameMap;
    emitter = new EventEmitter();

    loadFromFile(path: string): void {
        const fileBuffer = fs.readFileSync(path);
        const fileData = fileBuffer.toString();
        const options = JSON.parse(fileData) as GameMapOptions;

        this.map = new GameMap(options);
        const objects = this.map.getObjects();

        this.emitter.emit(GameMapServiceEvent.OBJECTS_SPAWNED, objects);

        console.log(`Loaded map from ${path} with ${objects.length} objects`);
    }

    getPlayerSpawnObjectIds(): number[] {
        return this.playerSpawnObjectIds;
    }

    getRandomPlayerSpawnObjectId(): number {
        return Random.getRandomArrayElement(this.playerSpawnObjectIds);
    } 
}
