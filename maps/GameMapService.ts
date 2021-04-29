import { GameModeProperties } from '@/game-mode/GameModeProperties';
import { GameModeType } from '@/game-mode/GameModeType';
import GameObject, { GameObjectOptions } from '@/object/GameObject';
import Team from '@/team/Team';
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
    private map?: GameMap;
    private gameMode?: GameModeType;
    emitter = new EventEmitter<GameMapServiceEvents>();

    setGameMode(gameMode: GameModeType): void {
        this.gameMode = gameMode;
    }

    getGameMode(): GameModeType | undefined {
        return this.gameMode;
    }

    loadFromFile(path: string): void {
        if (this.gameMode === undefined) {
            throw new Error('Cannot load map without a game mode');
        }

        let message = `Loaded map from ${path} with: `;
        this.map = new GameMap(path);

        const objects = this.map.getObjects();
        this.emitter.emit(GameMapServiceEvent.OBJECTS_SPAWNED, objects);
        message += `${objects.length} objects`;

        const gameModeProperties = GameModeProperties.getTypeProperties(this.gameMode);
        if (gameModeProperties.hasTeams) {
            const teams = this.map.getTeams();
            if (teams === undefined) {
                throw new Error('Cannot load map without teams in game mode that has teams');
            }
            this.emitter.emit(GameMapServiceEvent.TEAMS_CREATED, teams);
            message += `, ${teams.length} teams`;
        }

        console.log(message);
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
