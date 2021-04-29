import GameObject, { PartialGameObjectOptions } from '@/object/GameObject';
import EventEmitter from 'eventemitter3';
import GameMap from './GameMap';

export enum GameMapServiceEvent {
    OBJECTS_SPAWNED = 'objects-spawned',
}

interface GameMapServiceEvents {
    [GameMapServiceEvent.OBJECTS_SPAWNED]: (objects: GameObject[]) => void;
}

export default class GameMapService {
    private map?: GameMap;
    emitter = new EventEmitter<GameMapServiceEvents>();

    loadFromFile(path: string): void {
        this.map = new GameMap(path);
        const objects = this.map.getObjects();

        this.emitter.emit(GameMapServiceEvent.OBJECTS_SPAWNED, objects);

        console.log(`Loaded map from ${path} with ${objects.length} objects`);
    }

    setMapObjects(objects: GameObject[]): void {
        if (this.map === undefined) {
            return;
        }

        const objectsOptions = objects.map(o => o.toSaveOptions())
            .filter(o => o !== undefined) as GameObjectOptions[];
        this.map.setObjectsFromBlocks([]);
        this.map.setObjectsFromOptions(objectsOptions);
    }

    saveToFile(path?: string): void {
        if (this.map === undefined) {
            return;
        }

        this.map.write(path);
    }
}
