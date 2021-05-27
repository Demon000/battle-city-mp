import GameObject, { GameObjectOptions } from '@/object/GameObject';
import { TeamOptions } from '@/team/Team';
import LazyIterable from '@/utils/LazyIterable';
import EventEmitter from 'eventemitter3';
import GameMap from './GameMap';


export enum GameMapServiceEvent {
    MAP_OBJECTS_OPTIONS = 'map-objects-options',
    MAP_TEAMS_OPTIONS = 'map-teams-options',
}

interface GameMapServiceEvents {
    [GameMapServiceEvent.MAP_OBJECTS_OPTIONS]: (objectsOptions: GameObjectOptions[]) => void;
    [GameMapServiceEvent.MAP_TEAMS_OPTIONS]: (teamsOptions: TeamOptions[]) => void;
}

export default class GameMapService {
    private map?: GameMap;
    emitter = new EventEmitter<GameMapServiceEvents>();

    loadFromFile(path: string): void {
        let message = `Loaded map from ${path} with: `;
        this.map = new GameMap(path);

        const objectsOptions = this.map.getObjectsOptions();
        this.emitter.emit(GameMapServiceEvent.MAP_OBJECTS_OPTIONS, objectsOptions);
        message += `${objectsOptions.length} objects`;

        const teamsOptions = this.map.getTeamsOptions();
        this.emitter.emit(GameMapServiceEvent.MAP_TEAMS_OPTIONS, teamsOptions);
        message += `, ${teamsOptions.length} teams`;

        console.log(message);
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
