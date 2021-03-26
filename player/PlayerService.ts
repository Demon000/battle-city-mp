import MapRepository from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import ButtonPressAction, { MOVE_BUTTON_TYPES, ButtonState, BUTTON_TYPE_DIRECTION, ButtonType } from '../actions/ButtonPressAction';
import { Direction } from '../physics/Direction';
import Player, { PlayerSpawnStatus } from './Player';

export enum PlayerServiceEvent {
    PLAYER_ADDED = 'player-added',
    PLAYER_CHANGED = 'player-changed',
    PLAYER_REMOVED = 'player-removed',

    PLAYER_MOVING = 'player-moving',
    PLAYER_NOT_MOVING = 'player-not-moving',
    PLAYER_SHOOTING = 'player-shooting',
    PLAYER_NOT_SHOOTING = 'player-not-shooting',
    PLAYER_SPAWN_TANK_REQUESTED = 'player-spawn-tank-requested',
    PLAYER_DESPAWN_TANK_REQUESTED = 'player-despawn-tank-requested',
}

export default class PlayerService {
    private repository;
    emitter = new EventEmitter();

    constructor(repository: MapRepository<string, Player>) {
        this.repository = repository;
    }

    getPlayer(playerId: string): Player {
        return this.repository.get(playerId);
    }

    getPlayers(): Player[] {
        return this.repository.getAll();
    }

    addPlayer(player: Player): void {
        this.repository.add(player.id, player);
        this.emitter.emit(PlayerServiceEvent.PLAYER_ADDED, player);
    }

    addPlayers(players: Player[]): void {
        for (const player of players) {
            this.addPlayer(player);
        }
    }

    createPlayer(playerId: string): void {
        if (this.repository.exists(playerId)) {
            throw new Error('Player is already connected');
        }
 
        const player = new Player({
            id: playerId,
        });
        this.addPlayer(player);
    }

    setPlayerTankId(playerId: string, tankId?: number): void {
        const player = this.repository.get(playerId);
        player.tankId = tankId;
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player);
    }

    updatePlayer(newPlayer: Player): void {
        const player = this.repository.get(newPlayer.id);
        player.setOptions(newPlayer);
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player);
    }

    getPlayerTankId(playerId: string): number | undefined {
        const player = this.repository.get(playerId);
        return player.tankId;
    }

    requestPlayerSpawnStatus(playerId: string, spawnStatus: PlayerSpawnStatus): void {
        const player = this.repository.get(playerId);
        player.requestedSpawnStatus = spawnStatus;
    }

    requestPlayerDisconnect(playerId: string): void {
        const player = this.repository.get(playerId);
        player.disconnected = true;
    }

    addPlayerButtonPressAction(playerId: string, action: ButtonPressAction): void {
        const player = this.repository.get(playerId);
        player.map.set(action.buttonType, action);
    }
    
    getPlayerDominantMovementDirection(playerId: string): Direction | undefined {
        const player = this.repository.get(playerId);
        let actions: ButtonPressAction[] = [];

        for (const buttonType of MOVE_BUTTON_TYPES) {
            const action = player.map.get(buttonType);
            if (!action) {
                continue;
            }

            actions.push(action);
        }

        actions = actions
            .filter(a => a.buttonState === ButtonState.PRESSED)
            .sort((a, b) => b.timestamp - a.timestamp);

        if (!actions[0]) {
            return undefined;
        }

        return BUTTON_TYPE_DIRECTION[actions[0].buttonType];
    }

    isPlayerShooting(playerId: string): boolean {
        const player = this.repository.get(playerId);
        const action = player.map.get(ButtonType.SHOOT);
        if (!action) {
            return false;
        }

        return action.buttonState === ButtonState.PRESSED;
    }

    processPlayerSpawnStatus(playerId: string): void {
        const player = this.repository.get(playerId);
        if (player.requestedSpawnStatus === player.spawnStatus) {
            return;
        }

        if (player.requestedSpawnStatus === PlayerSpawnStatus.SPAWN) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_SPAWN_TANK_REQUESTED, playerId);
        } else if (player.requestedSpawnStatus === PlayerSpawnStatus.DESPAWN) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_DESPAWN_TANK_REQUESTED, player.id, player.tankId);
        }

        player.spawnStatus = player.requestedSpawnStatus;
    }

    processPlayerDisconnectStatus(playerId: string): boolean {
        const player = this.repository.get(playerId);
        if (!player.disconnected) {
            return false;
        }

        this.repository.remove(playerId);
        this.emitter.emit(PlayerServiceEvent.PLAYER_REMOVED, playerId);
        return true;
    }

    processPlayerMovement(playerId: string): void {
        const direction = this.getPlayerDominantMovementDirection(playerId);
        if (direction === undefined) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_NOT_MOVING, playerId);
        } else {
            this.emitter.emit(PlayerServiceEvent.PLAYER_MOVING, playerId, direction);
        }
    }

    processPlayerShooting(playerId: string): void {
        const isShooting = this.isPlayerShooting(playerId);
        if (isShooting) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_SHOOTING, playerId);
        } else {
            this.emitter.emit(PlayerServiceEvent.PLAYER_NOT_SHOOTING, playerId);
        }
    }

    processPlayerActions(): void {
        const players = this.repository.getAll();
        for (const player of players) {
            this.processPlayerSpawnStatus(player.id);
            const disconnected = this.processPlayerDisconnectStatus(player.id);
            if (disconnected) {
                continue;
            }

            this.processPlayerMovement(player.id);
            this.processPlayerShooting(player.id);
        }
    }

    removePlayer(playerId: string): void {
        this.repository.remove(playerId);
        this.emitter.emit(PlayerServiceEvent.PLAYER_REMOVED, playerId);
    }
}
