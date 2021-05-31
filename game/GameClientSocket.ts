import Action from '@/actions/Action';
import { Color } from '@/drawable/Color';
import Point from '@/physics/point/Point';
import { TankTier } from '@/tank/TankTier';
import { Socket } from 'socket.io-client';
import GameClient from './GameClient';
import { BatchGameEvent, GameEvent } from './GameEvent';
import { GameSocketEvent, GameSocketEvents } from './GameSocketEvent';

export default class GameClientSocket {
    socket;
    gameClient;
    initialized = false;

    constructor(socket: Socket<GameSocketEvents>, gameClient: GameClient) {
        this.socket = socket;
        this.gameClient = gameClient;

        this.socket.on(GameSocketEvent.BATCH, (events: BatchGameEvent[]) => {
            events.forEach(this.onEvent, this);
        });

        this.socket.on('connect', () => {
            this.gameClient.setOwnPlayerId(this.socket.id);
            this.gameClient.ticker.start();
            console.log('Connected');
        });

        this.socket.on('disconnect', () => {
            this.gameClient.ticker.stop();
        });

        this.socket.connect();
    }

    onEvent(batch: BatchGameEvent): void {
        switch (batch[0]) {
            case GameEvent.SERVER_STATUS:
                this.gameClient.onServerStatus(batch[1]);
                break;
            case GameEvent.PLAYER_ADDED:
                this.gameClient.onPlayerAdded(batch[1]);
                break;
            case GameEvent.PLAYER_CHANGED:
                this.gameClient.onPlayerChanged(batch[1], batch[2]);
                break;
            case GameEvent.PLAYER_REMOVED:
                this.gameClient.onPlayerRemoved(batch[1]);
                break;
            case GameEvent.TEAM_PLAYER_ADDED:
                this.gameClient.onTeamPlayerAdded(batch[1], batch[2]);
                break;
            case GameEvent.TEAM_PLAYER_REMOVED:
                this.gameClient.onTeamPlayerRemoved(batch[1], batch[2]);
                break;
            case GameEvent.OBJECT_REGISTERED:
                this.gameClient.onObjectRegistered(batch[1]);
                break;
            case GameEvent.OBJECT_CHANGED:
                this.gameClient.onObjectChanged(batch[1], batch[2]);
                break;
            case GameEvent.OBJECT_UNREGISTERED:
                this.gameClient.onObjectUnregistered(batch[1]);
                break;
            default:
                throw new Error('Invalid event');
        }
    }

    requestPlayerTankSpawn(): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_SPAWN);
    }

    requestPlayerTankColor(color: Color): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_COLOR, color);
    }

    requestPlayerTankDespawn(): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_DESPAWN);
    }

    requestPlayerTankTier(tier: TankTier): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TANK_TIER, tier);
    }

    requestPlayerTeam(teamId: string | null): void {
        this.socket.emit(GameSocketEvent.PLAYER_REQUEST_TEAM, teamId);
    }

    requestPlayerAction(action: Action): void {
        this.socket.emit(GameSocketEvent.PLAYER_ACTION, action.toOptions());
    }

    setPlayerName(name: string): void {
        this.socket.emit(GameSocketEvent.PLAYER_SET_NAME, name);
    }

    toggleMapEditor(): void {
        const enabled = this.gameClient.toggleMapEditorEnabled();
        this.socket.emit(GameSocketEvent.PLAYER_MAP_EDITOR_ENABLE, enabled);
    }

    mapEditorCreateObjects(): void {
        const objectsOptions = this.gameClient.getMapEditorObjectsOptions();
        this.socket.emit(GameSocketEvent.PLAYER_MAP_EDITOR_CREATE_OBJECTS, objectsOptions);
    }

    mapEditorDestroyObjects(position: Point): void {
        const destroyBox = this.gameClient.getMapEditorDestroyBox(position);
        if (destroyBox === undefined) {
            return;
        }

        this.socket.emit(GameSocketEvent.PLAYER_MAP_EDITOR_DESTROY_OBJECTS, destroyBox);
    }

    saveMap(): void {
        this.socket.emit(GameSocketEvent.PLAYER_MAP_EDITOR_SAVE);
    }
}
