import { Color } from '@/drawable/Color';
import { TankTier } from '@/tank/TankTier';
import MapRepository from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import ButtonPressAction, { MOVE_BUTTON_TYPES, ButtonState, BUTTON_TYPE_DIRECTION, ButtonType } from '../actions/ButtonPressAction';
import { Direction } from '../physics/Direction';
import Player, { PlayerSpawnStatus } from './Player';

export enum PlayerServiceEvent {
    PLAYER_ADDED = 'player-added',
    PLAYER_CHANGED = 'player-changed',
    PLAYER_REMOVED = 'player-removed',

    PLAYER_REQUESTED_MOVE = 'player-requested-move',
    PLAYER_REQUESTED_SHOOT = 'player-requested-shoot',
    PLAYER_REQUESTED_SPAWN_STATUS = 'player-requested-spawn-status',

    PLAYER_REQUESTED_SERVER_STATUS = 'player-requested-server-status',
}

interface PlayerServiceEvents {
    [PlayerServiceEvent.PLAYER_ADDED]: (player: Player) => void,
    [PlayerServiceEvent.PLAYER_CHANGED]: (player: Player) => void,
    [PlayerServiceEvent.PLAYER_REMOVED]: (playerId: string) => void,
    [PlayerServiceEvent.PLAYER_REQUESTED_MOVE]: (playerId: string, direction: Direction | undefined) => void,
    [PlayerServiceEvent.PLAYER_REQUESTED_SHOOT]: (playerId: string, isShooting: boolean) => void,
    [PlayerServiceEvent.PLAYER_REQUESTED_SPAWN_STATUS]: (playerId: string, spawnStatus: PlayerSpawnStatus) => void,
    [PlayerServiceEvent.PLAYER_REQUESTED_SERVER_STATUS]: (playerId: string) => void,
}

export default class PlayerService {
    private repository;
    emitter = new EventEmitter<PlayerServiceEvents>();

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
            tankId: null,
        });
        this.addPlayer(player);
    }

    setPlayerTankId(playerId: string, tankId: number | null): void {
        const player = this.repository.get(playerId);
        player.tankId = tankId;
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player);
    }

    updatePlayer(newPlayer: Player): void {
        const player = this.repository.get(newPlayer.id);
        player.setOptions(newPlayer);
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player);
    }

    getPlayerTankId(playerId: string): number | null {
        const player = this.repository.get(playerId);
        return player.tankId;
    }

    setPlayerRequestedSpawnStatus(playerId: string, spawnStatus: PlayerSpawnStatus): void {
        const player = this.repository.get(playerId);
        player.requestedSpawnStatus = spawnStatus;
    }

    setPlayerRequestedDisconnect(playerId: string): void {
        const player = this.repository.get(playerId);
        player.disconnected = true;
    }

    setPlayerRequestedServerStatus(playerId: string): void {
        const player = this.repository.get(playerId);
        player.requestedServerStatus = true;
    }

    setPlayerRequestedTankTier(playerId: string, tier: TankTier): void {
        const player = this.repository.get(playerId);
        player.requestedTankTier = tier;
    }

    setPlayerRequestedTankColor(playerId: string, color: Color): void {
        const player = this.repository.get(playerId);
        player.requestedTankColor = color;
    }

    addPlayerButtonPressAction(playerId: string, action: ButtonPressAction): void {
        const player = this.repository.get(playerId);
        player.map.set(action.buttonType, action);
    }
    
    private getPlayerDominantMovementDirection(player: Player): Direction | undefined {
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

    private isPlayerShooting(player: Player): boolean {
        const action = player.map.get(ButtonType.SHOOT);
        if (!action) {
            return false;
        }

        return action.buttonState === ButtonState.PRESSED;
    }

    private processPlayerSpawnStatus(player: Player): void {
        if ((player.requestedSpawnStatus === PlayerSpawnStatus.SPAWN && player.tankId === null)
            || (player.requestedSpawnStatus === PlayerSpawnStatus.DESPAWN && player.tankId !== null)) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_SPAWN_STATUS, player.id, player.requestedSpawnStatus);
        }

        player.requestedSpawnStatus = PlayerSpawnStatus.NONE;
    }

    private processPlayerDisconnectStatus(player: Player): boolean {
        if (!player.disconnected) {
            return false;
        }

        this.repository.remove(player.id);
        this.emitter.emit(PlayerServiceEvent.PLAYER_REMOVED, player.id);
        return true;
    }

    private processPlayerMovement(player: Player): void {
        const direction = this.getPlayerDominantMovementDirection(player);
        if (direction === player.lastRequestedDirection) {
            return;
        }

        player.lastRequestedDirection = direction;
        this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_MOVE, player.id, direction);
    }

    private processPlayerShooting(player: Player): void {
        const isShooting = this.isPlayerShooting(player);
        if (isShooting === player.lastIsShooting) {
            return;
        }

        player.lastIsShooting = isShooting;
        this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_SHOOT, player.id, isShooting);
    }

    private processPlayerServerStatusRequest(player: Player): void {
        if (player.requestedServerStatus) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_SERVER_STATUS, player.id);
        }
        player.requestedServerStatus = false;
    }

    processPlayersStatus(): void {
        const players = this.repository.getAll();
        for (const player of players) {
            this.processPlayerSpawnStatus(player);
            const disconnected = this.processPlayerDisconnectStatus(player);
            if (disconnected) {
                continue;
            }

            this.processPlayerServerStatusRequest(player);
            this.processPlayerMovement(player);
            this.processPlayerShooting(player);
        }
    }

    removePlayer(playerId: string): void {
        this.repository.remove(playerId);
        this.emitter.emit(PlayerServiceEvent.PLAYER_REMOVED, playerId);
    }

    getOwnPlayer(): Player | undefined {
        const players = this.repository.getAll();
        for (const player of players) {
            if (player.isOwnPlayer) {
                return player;
            }
        }

        return undefined;
    }
}
