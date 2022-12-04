import { Config } from '@/config/Config';
import { Color } from '@/drawable/Color';
import { EntityId } from '@/ecs/EntityId';
import { TankTier } from '@/subtypes/TankTier';
import { assert } from '@/utils/assert';
import { MapRepository } from '@/utils/MapRepository';
import EventEmitter from 'eventemitter3';
import { ButtonPressAction, MOVE_BUTTON_TYPES, ButtonState, BUTTON_TYPE_DIRECTION, ButtonType } from '../actions/ButtonPressAction';
import { Direction } from '../physics/Direction';
import { Player, PartialPlayerOptions, PlayerSpawnStatus } from '@/player/Player';
import { PlayerPoints, PlayerPointsEvent } from '@/player/PlayerPoints';

export enum PlayerServiceEvent {
    PLAYER_ADDED = 'player-added',
    PLAYER_CHANGED = 'player-changed',
    PLAYER_BEFORE_REMOVE = 'player-before-remove',
    PLAYER_REMOVED = 'player-removed',
    PLAYERS_CHANGED = 'players-changed',

    PLAYER_REQUESTED_MOVE = 'player-requested-move',
    PLAYER_REQUESTED_SHOOT = 'player-requested-shoot',
    PLAYER_REQUESTED_DROP_FLAG = 'player-requested-drop-flag',
    PLAYER_REQUESTED_SPAWN_STATUS = 'player-requested-spawn-status',

    PLAYER_REQUESTED_SERVER_STATUS = 'player-requested-server-status',

    OWN_PLAYER_ADDED = 'own-player-added',
    OWN_PLAYER_CHANGED_TANK_ID = 'own-player-changd-tank-id',
    OWN_PLAYER_CHANGED_TEAM_ID = 'own-player-changd-team-id',
    OWN_PLAYER_CHANGED_TANK_TIER = 'own-player-changed-tank-tier',
    OWN_PLAYER_CHANGED_TANK_COLOR = 'own-player-changed-tank-color',
    OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT = 'own-player-changed-respawn-timeout',
    OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS = 'own-player-changed-requested-spawn-status',
}

export interface PlayerServiceEvents {
    [PlayerServiceEvent.PLAYER_ADDED]: (player: Player) => void;
    [PlayerServiceEvent.PLAYER_CHANGED]: (playerId: string, playerOptions: PartialPlayerOptions) => void;
    [PlayerServiceEvent.PLAYER_BEFORE_REMOVE]: (playerId: string) => void;
    [PlayerServiceEvent.PLAYER_REMOVED]: (playerId: string) => void;
    [PlayerServiceEvent.PLAYERS_CHANGED]: () => void;
    [PlayerServiceEvent.PLAYER_REQUESTED_MOVE]: (playerId: string, direction: Direction | undefined) => void;
    [PlayerServiceEvent.PLAYER_REQUESTED_SHOOT]: (playerId: string, isShooting: boolean) => void;
    [PlayerServiceEvent.PLAYER_REQUESTED_DROP_FLAG]: (playerId: string) => void;
    [PlayerServiceEvent.PLAYER_REQUESTED_SPAWN_STATUS]: (playerId: string, spawnStatus: PlayerSpawnStatus) => void;
    [PlayerServiceEvent.PLAYER_REQUESTED_SERVER_STATUS]: (playerId: string) => void;
    [PlayerServiceEvent.OWN_PLAYER_ADDED]: (player: Player) => void;
    [PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_ID]: (tankId: EntityId | null) => void;
    [PlayerServiceEvent.OWN_PLAYER_CHANGED_TEAM_ID]: (teamId: string | null) => void;
    [PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_TIER]: (tier: TankTier) => void;
    [PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_COLOR]: (color: Color) => void;
    [PlayerServiceEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT]: (respawnTimeout: number) => void;
    [PlayerServiceEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS]: (requestedSpawnStatus: PlayerSpawnStatus) => void;
}

export class PlayerService {
    private ownPlayerId?: string;
    emitter = new EventEmitter<PlayerServiceEvents>();

    constructor(
        private config: Config,
        private repository: MapRepository<string, Player>,
    ) {}

    findPlayer(playerId: string): Player | undefined {
        return this.repository.find(playerId);
    }

    getPlayer(playerId: string): Player {
        return this.repository.get(playerId);
    }

    getPlayers(): Iterable<Player> {
        return this.repository.getAll();
    }

    getSortedPlayers(): Player[] {
        const playersIterable = this.repository.getAll();
        const players = Array.from(playersIterable);
        return players.sort((a, b) => b.points - a.points);
    }

    addPlayer(player: Player): void {
        this.repository.add(player.id, player);
        this.emitter.emit(PlayerServiceEvent.PLAYER_ADDED, player);
        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);

        if (player.id === this.ownPlayerId) {
            this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_ADDED, player);
            this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_TIER, player.requestedTankTier);
            this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_COLOR, player.requestedTankColor);
        }
    }

    addPlayers(players: Iterable<Player>): void {
        for (const player of players) {
            this.addPlayer(player);
        }
    }

    createPlayer(playerId: string): void {
        assert(!this.repository.exists(playerId),
            `Player with id '${playerId}' is already connected`);
 
        const player = new Player({
            id: playerId,
            tankId: null,
            teamId: null,
        });
        this.addPlayer(player);
    }

    private setPlayerRespawnTimeout(player: Player, respawnTimeout: number): void {
        const oldRespawnTimeout = Math.ceil(player.respawnTimeout);
        player.respawnTimeout = respawnTimeout;
        const newRespawnTimeout = Math.ceil(respawnTimeout);
        if (oldRespawnTimeout === newRespawnTimeout) {
            return;
        }

        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player.id, {
            respawnTimeout: newRespawnTimeout,
        });
    }

    setPlayerTankId(playerId: string, tankId: EntityId | null): void {
        const player = this.repository.find(playerId);
        if (player === undefined) {
            return;
        }

        if (player.tankId === tankId) {
            return;
        }

        player.tankId = tankId;

        if (player.tankId === null) {
            const respawnTimeout = this.config.get<number>('player', 'respawnTimeout');
            this.setPlayerRespawnTimeout(player, respawnTimeout);
        }

        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, playerId, {
            tankId,
        });
        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);
    }

    updatePlayer(playerId: string, playerOptions: PartialPlayerOptions): void {
        const player = this.repository.get(playerId);
        player.setOptions(playerOptions);
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, playerId, playerOptions);
        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);

        if (player.id === this.ownPlayerId) {
            if (playerOptions.tankId !== undefined) {
                this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_ID,
                    playerOptions.tankId);
            }

            if (playerOptions.teamId !== undefined) {
                this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_TEAM_ID,
                    playerOptions.teamId);
            }

            if (playerOptions.requestedTankTier !== undefined) {
                this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_TIER,
                    playerOptions.requestedTankTier);
            }

            if (playerOptions.requestedTankColor !== undefined) {
                this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_TANK_COLOR,
                    playerOptions.requestedTankColor);
            }

            if (playerOptions.respawnTimeout !== undefined) {
                this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT,
                    playerOptions.respawnTimeout);
            }

            if (playerOptions.requestedSpawnStatus !== undefined) {
                this.emitter.emit(PlayerServiceEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS,
                    playerOptions.requestedSpawnStatus);
            }
        }
    }

    setPlayerTeamId(playerId: string, teamId: string | null): void {
        const player = this.repository.get(playerId);
        if (player.teamId === teamId) {
            return;
        }

        player.teamId = teamId;

        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, playerId, {
            teamId,
        });
        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);
    }

    setPlayerName(playerId: string, name: string): void {
        const player = this.repository.get(playerId);
        player.name = name;
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, playerId, {
            name,
        });
        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);
    }

    setPlayerRequestedSpawnStatus(playerId: string, spawnStatus: PlayerSpawnStatus): void {
        const player = this.repository.get(playerId);
        player.requestedSpawnStatus = spawnStatus;
        player.dirtyRequestedSpawnStatus = true;
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
        if (player.requestedTankTier === tier) {
            return;
        }

        player.requestedTankTier = tier;

        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, playerId, {
            requestedTankTier: tier,
        });
    }

    setPlayerRequestedTankColor(playerId: string, color: Color): void {
        const player = this.repository.get(playerId);
        if (player.requestedTankColor === color) {
            return;
        }

        player.requestedTankColor = color;

        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, playerId, {
            requestedTankColor: color,
        });
    }

    private cancelPlayerActions(player: Player): void {
        player.map.clear();
    }

    addPlayerButtonPressAction(playerId: string, action: ButtonPressAction): void {
        const player = this.repository.get(playerId);
        if (action.buttonType === ButtonType.ALL
            && action.buttonState === ButtonState.UNPRESSED) {
            this.cancelPlayerActions(player);
        } else {
            player.map.set(action.buttonType, action);
        }
    }

    private setPlayerPoints(player: Player, points: number): void {
        player.points = points;

        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player.id, {
            points: player.points,
        });
    }

    addPlayerPoints(playerId: string, event: PlayerPointsEvent): void {
        const player = this.repository.get(playerId);
        this.setPlayerPoints(player, player.points + PlayerPoints[event]);
    }

    private setPlayerKills(player: Player, kills: number): void {
        player.kills = kills;
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player.id, {
            kills: player.kills,
        });
    }

    addPlayerKill(playerId: string): void {
        const player = this.repository.find(playerId);
        if (player === undefined) {
            return;
        }

        this.addPlayerPoints(playerId, PlayerPointsEvent.KILL);
        this.setPlayerKills(player, player.kills + 1);

        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);
    }

    private setPlayerDeaths(player: Player, deaths: number): void {
        player.deaths = deaths;
        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player.id, {
            deaths: player.deaths,
        });
    }

    addPlayerDeath(playerId: string): void {
        const player = this.repository.get(playerId);

        this.addPlayerPoints(playerId, PlayerPointsEvent.DEATH);
        this.setPlayerDeaths(player, player.deaths + 1);

        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);
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

        if (actions[0] === undefined) {
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

    private isPlayerDroppingFlag(player: Player): boolean {
        const action = player.map.get(ButtonType.DROP_FLAG);
        if (!action) {
            return false;
        }

        return action.buttonState === ButtonState.PRESSED;
    }

    private processPlayerSpawnStatus(player: Player): void {
        if (player.dirtyRequestedSpawnStatus) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player.id, {
                requestedSpawnStatus: player.requestedSpawnStatus,
            });

            player.dirtyRequestedSpawnStatus =  false;
        }

        let handleRequestedSpawnStatus = false;
        if (player.requestedSpawnStatus === PlayerSpawnStatus.SPAWN
            && player.tankId === null
            && player.respawnTimeout == 0) {
            handleRequestedSpawnStatus = true;
        }

        if (player.requestedSpawnStatus === PlayerSpawnStatus.DESPAWN
            && player.tankId !== null) {
            handleRequestedSpawnStatus = true;
        }

        if (!handleRequestedSpawnStatus) {
            return;
        }

        this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_SPAWN_STATUS, player.id, player.requestedSpawnStatus);

        player.requestedSpawnStatus = PlayerSpawnStatus.NONE;

        this.emitter.emit(PlayerServiceEvent.PLAYER_CHANGED, player.id, {
            requestedSpawnStatus: player.requestedSpawnStatus,
        });
    }

    private processPlayerDisconnectStatus(player: Player): boolean {
        if (!player.disconnected) {
            return false;
        }

        this.removePlayer(player.id);
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
        if (isShooting === player.isShooting) {
            return;
        }

        player.isShooting = isShooting;
        this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_SHOOT, player.id, isShooting);
    }

    private processPlayerDroppingFlag(player: Player): void {
        const isDroppingFlag = this.isPlayerDroppingFlag(player);
        if (!isDroppingFlag) {
            return;
        }

        this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_DROP_FLAG, player.id);
    }

    private processPlayerServerStatusRequest(player: Player): void {
        if (player.requestedServerStatus) {
            this.emitter.emit(PlayerServiceEvent.PLAYER_REQUESTED_SERVER_STATUS, player.id);
        }
        player.requestedServerStatus = false;
    }

    private processPlayerRespawnTimeout(player: Player, deltaSeconds: number): void {
        if (player.tankId !== null) {
            return;
        }

        if (player.respawnTimeout == 0) {
            return;
        }

        let newRespawnTimeout = player.respawnTimeout - deltaSeconds;
        if (newRespawnTimeout < 0) {
            newRespawnTimeout = 0;
        }

        this.setPlayerRespawnTimeout(player, newRespawnTimeout);
    }

    cancelPlayersActions(): void {
        const players = this.repository.getAll();
        for (const player of players) {
            this.cancelPlayerActions(player);
        }
    }

    processPlayersStatus(deltaSeconds: number): void {
        const players = this.repository.getAll();
        for (const player of players) {
            this.processPlayerRespawnTimeout(player, deltaSeconds);
            this.processPlayerSpawnStatus(player);
            const disconnected = this.processPlayerDisconnectStatus(player);
            if (disconnected) {
                continue;
            }

            this.processPlayerServerStatusRequest(player);
            this.processPlayerMovement(player);
            this.processPlayerShooting(player);
            this.processPlayerDroppingFlag(player);
        }
    }

    removePlayer(playerId: string): void {
        this.emitter.emit(PlayerServiceEvent.PLAYER_BEFORE_REMOVE, playerId);
        this.repository.remove(playerId);
        this.emitter.emit(PlayerServiceEvent.PLAYER_REMOVED, playerId);
        this.emitter.emit(PlayerServiceEvent.PLAYERS_CHANGED);
    }

    getOwnPlayer(): Player | undefined {
        const players = this.repository.getAll();
        for (const player of players) {
            if (player.id === this.ownPlayerId) {
                return player;
            }
        }

        return undefined;
    }

    setOwnPlayerId(playerId: string): void {
        this.ownPlayerId = playerId;
    }

    clear(): void {
        this.repository.clear();
    }

    resetFields(): void {
        const players = this.repository.getAll();

        for (const player of players) {
            this.setPlayerPoints(player, 0);
            this.setPlayerKills(player, 0);
            this.setPlayerDeaths(player, 0);
            this.setPlayerRespawnTimeout(player, 0);
        }
    }
}
