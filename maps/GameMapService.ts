import { Config } from '@/config/Config';
import { EntityBlueprint } from '@/ecs/EntityBlueprint';
import { GameMap } from './GameMap';

export class GameMapService {
    private map?: GameMap;

    constructor(
        private config: Config,
        private entityBlueprint: EntityBlueprint,
    ) {}

    loadByName(name: string): GameMap {
        return this.map = new GameMap(name, this.config, this.entityBlueprint);
    }

    getLoadedMap(): GameMap | undefined {
        return this.map;
    }
}
