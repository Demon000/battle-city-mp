import { Socket } from 'socket.io-client';
import { GameObjectOptions } from '../object/GameObject';
import GameObjectFactory from '../object/GameObjectFactory';
import Player, { PlayerOptions } from '../player/Player';
import GameClient from './GameClient';
import { GameEvent } from './GameEvent';

export default class GameClientSocket {
    socket;
    gameClient;
    initialized = false;

    constructor(socket: Socket, gameClient: GameClient) {
        this.socket = socket;
        this.gameClient = gameClient;

        this.socket.on('connect', () => {
            console.log('Connected');
        });

        this.registerListeners();
        this.initialize();
    }

    createPlayer(playerOptions: PlayerOptions): Player {
        const player = new Player(playerOptions);
        if (player.id === this.socket.id) {
            player.isOwnPlayer = true;
        }
        return player;
    }

    initialize(): void {
        let gameObjectsLoaded = false;
        let playersLoaded = false;

        const checkIfInitialized = () => {
            if (!gameObjectsLoaded || !playersLoaded || this.initialized) {
                return;
            }

            this.initialized = true;
        };

        this.socket.emit(GameEvent.GET_GAME_OBJECTS, (objectOptions: GameObjectOptions[]) => {
            const objects = objectOptions.map(o => GameObjectFactory.buildFromOptions(o));
            this.gameClient.onObjectsRegisteredOnServer(objects);
            gameObjectsLoaded = true;
            checkIfInitialized();
        });

        this.socket.emit(GameEvent.GET_PLAYERS, (playerOptions: PlayerOptions[]) => {
            const players = playerOptions.map(this.createPlayer);
            this.gameClient.onPlayersAddedOnServer(players);
            playersLoaded = true;
            checkIfInitialized();
        });
    }

    registerListeners(): void {
        const runIfInitialized = (fn: () => void) => {
            if (this.initialized) {
                fn();
            }
        };

        this.socket.on(GameEvent.PLAYER_ADDED, (playerOptions: PlayerOptions) => runIfInitialized(() => {
            const player = this.createPlayer(playerOptions);
            this.gameClient.onPlayerAddedOnServer(player);
        }));

        this.socket.on(GameEvent.PLAYER_CHANGED, (playerOptions: PlayerOptions) => runIfInitialized(() => {
            const player = this.createPlayer(playerOptions);
            this.gameClient.onPlayerChangedOnServer(player);
        }));

        this.socket.on(GameEvent.PLAYER_REMOVED, (playerId: string) => runIfInitialized(() => {
            this.gameClient.onPlayerRemovedOnServer(playerId);
        }));

        this.socket.on(GameEvent.OBJECT_REGISTERED, (objectOptions: GameObjectOptions) => runIfInitialized(() => {
            const object = GameObjectFactory.buildFromOptions(objectOptions);
            this.gameClient.onObjectRegisteredOnServer(object);
        }));

        this.socket.on(GameEvent.OBJECT_CHANGED, (objectOptions: GameObjectOptions) => runIfInitialized(() => {
            const object = GameObjectFactory.buildFromOptions(objectOptions);
            this.gameClient.onObjectChangedOnServer(object);
        }));

        this.socket.on(GameEvent.OBJECT_UNREGISTERED, (objectId: number) => runIfInitialized(() => {
            this.gameClient.onObjectUnregisteredOnServer(objectId);
        }));
    }
}
