import GameObject, { GameObjectOptions } from '@/object/GameObject';
import GameObjectFactory from '@/object/GameObjectFactory';
import Team from '@/team/Team';
import LazyIterable from '@/utils/LazyIterable';
import EventEmitter from 'eventemitter3';
import GameMap from './GameMap';


export enum GameMapServiceEvent {
    OBJECTS_SPAWNED = 'objects-spawned',
    TEAMS_CREATED = 'teams-created',
}

interface GameMapServiceEvents {
    [GameMapServiceEvent.OBJECTS_SPAWNED]: (objects: GameObject[]) => void;
    [GameMapServiceEvent.TEAMS_CREATED]: (teams: Team[]) => void;
}

export default class GameMapService {
    private gameObjectFactory;
    private map?: GameMap;
    emitter = new EventEmitter<GameMapServiceEvents>();

    constructor(gameObjectFactory: GameObjectFactory) {
        this.gameObjectFactory = gameObjectFactory;
    }

    loadFromFile(path: string): void {
        let message = `Loaded map from ${path} with: `;
        this.map = new GameMap(path);

        const objectsOptions = this.map.getObjectsOptions();
        const objects = objectsOptions.map(o => this.gameObjectFactory.buildFromOptions(o));
        this.emitter.emit(GameMapServiceEvent.OBJECTS_SPAWNED, objects);
        message += `${objectsOptions.length} objects`;

        const teams = this.map.getTeams();
        this.emitter.emit(GameMapServiceEvent.TEAMS_CREATED, teams);
        message += `, ${teams.length} teams`;

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
