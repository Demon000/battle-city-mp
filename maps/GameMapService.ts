import { Config } from '@/config/Config';
import { GameMap } from './GameMap';

export class GameMapService {
    private map?: GameMap;

    constructor(
        private config: Config,
    ) {}

    loadByName(name: string): GameMap {
        return this.map = new GameMap(name, this.config);
    }

    getLoadedMap(): GameMap | undefined {
        return this.map;
    }
}
