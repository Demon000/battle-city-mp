import { Config } from '@/config/Config';
import { GameObject } from '@/object/GameObject';
import { LazyIterable } from '@/utils/LazyIterable';
import { GameMap } from './GameMap';

export class GameMapService {
    private map?: GameMap;

    constructor(
        private config: Config,
    ) {}

    loadFromFile(path: string): GameMap {
        return this.map = new GameMap(path, this.config);
    }

    getLoadedMap(): GameMap | undefined {
        return this.map;
    }

    setMapObjects(objects: Iterable<GameObject>): void {
        if (this.map === undefined) {
            return;
        }

        const objectsOptions =
            LazyIterable.from(objects)
                .filter(o => !!o.savable)
                .map(o => o.toSaveOptions());
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
