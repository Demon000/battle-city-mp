<template>
    <div id="app-content">
        <div
            id="game-canvas-container"
            ref="canvasContainerElement"
            tabindex="1"
        >
            <canvas
                class="game-canvas"
                v-for="index in RenderPass.MAX"
                :key="index"
                :ref="addCanvasRef"
            ></canvas>

            <div id="game-overlay">
                <div id="fullscreen-controls" class="controls">
                    <img
                        class="image-button"
                        src="/assets/images/fullscreen_button.png"
                        alt="Enter fullscreen"
                        v-if="!isFullscreen"
                        @click="onFullscreenButtonClick"
                    >

                    <img
                        class="image-button"
                        src="/assets/images/fullscreen_exit_button.png"
                        alt="Exit fullscreen"
                        v-if="isFullscreen"
                        @click="onFullscreenButtonClick"
                    >
                </div>

                <div id="round-time">
                    <div class="round-time-group">
                        {{ roundTime }}
                    </div>
                </div>

                <div
                    id="tank-stats"
                    v-if="!isPlayerDead"
                >
                    <div class="tank-stats-group">
                        <label>Health</label>
                        <div>
                            <img
                                class="tank-stats-icon"
                                v-for="i in tankHealth"
                                :key="i"
                                src="/assets/images/heart_full.png"
                            >
                            <img
                                class="tank-stats-icon"
                                v-for="i in tankMissingHearts"
                                :key="i"
                                src="/assets/images/heart_empty.png"
                            >
                        </div>
                    </div>

                    <div
                        class="tank-stats-group"
                        v-if="tankMaxBullets !== null"
                    >
                        <label>Bullets</label>
                        <div class="tank-bullet">
                            <template
                                v-if="tankMaxBullets > 5"
                            >
                                {{ tankMissingBullets }} / {{ tankMaxBullets }}
                            </template>

                            <template
                                v-else-if="tankMissingBullets !== null"
                            >
                                <template v-for="i in tankMaxBullets" :key="i">
                                    <img
                                        class="tank-stats-icon"
                                        v-show="i <= tankMissingBullets"
                                        src="/assets/images/bullet_full.png"
                                    >
                                    <img
                                        class="tank-stats-icon"
                                        v-show="i > tankMissingBullets"
                                        src="/assets/images/bullet_empty.png"
                                    >
                                </template>
                            </template>
                        </div>
                    </div>
                </div>

                <div
                    id="stats-container"
                    v-if="isShowingScoreboard"
                >
                    <div
                        id="stats"
                        class="controls"
                    >
                        <table
                            v-if="ownPlayer !== null"
                        >
                            <tr class="header">
                                <td>Player name</td>
                                <td>Kills</td>
                                <td>Deaths</td>
                                <td>Points</td>
                                <td>Color</td>
                                <td>Tank</td>
                            </tr>
                            <tr
                                v-for="playerStats of playersStats"
                                :key="playerStats.id"
                                :class="{
                                    'is-own-player': playerStats.id === ownPlayer.id,
                                }"
                            >
                                <td>{{ playerStats.name }}</td>
                                <td>{{ playerStats.kills }}</td>
                                <td>{{ playerStats.deaths }}</td>
                                <td>{{ playerStats.points }}</td>
                                <td class="color-cell">
                                    <span
                                        class="color"
                                        :style="{
                                            background: ColorUtils.getRgbFromColor(playerStats.color),
                                        }"
                                    >
                                    </span>
                                </td>
                                <td>
                                    {{ playerStats.tier }}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div id="virtual-controls">
                    <div
                        ref="dpad"
                        id="virtual-dpad"
                    >
                    </div>
                    <div
                        id="virtual-shoot-button"
                        ref="shootButton"
                    >
                    </div>
                </div>
            </div>
        </div>

        <settings
            tabindex="2"
            id="game-settings"
            v-if="isShowingSettings"
            :playerName="playerName"
            :tankTier="tankTier"
            :tankColor="tankColor"
            :playerTeamId="playerTeamId"
            :isPlayerDead="isPlayerDead"
            :teams="teams"
            :hasTeams="hasTeams"
            :playerRequestedSpawnStatus="playerRequestedSpawnStatus"
            :playerRespawnTimeout="playerRespawnTimeout"
            ref="settingsElement"
            @player-name-change="onPlayerNameChanged"
            @player-team-change="onPlayerTeamChanged"
            @tank-tier-change="onPlayerColorChanged"
            @tank-color-change="onTankColorChanged"
            @spawn-click="onSpawnButtonClick"
            @escape-keyup="onKeyboardEvent"
        ></settings>
    </div>
</template>

<script lang="ts">
import Settings from './Settings.vue';
import { ActionFactory } from '@/actions/ActionFactory';
import { Color } from '@/drawable/Color';
import { GameClient, GameClientEvent } from '@/game/GameClient';
import { GameClientSocket } from '@/game/GameClientSocket';
import { GameSocketEvents } from '@/game/GameSocketEvent';
import { RenderPass } from '@/entity/RenderPass';
import { PlayerStats } from '@/player/PlayerStats';
import { TankTier } from '@/subtypes/TankTier';
import screenfull from 'screenfull';
import { io, Socket } from 'socket.io-client';
import { markRaw } from 'vue';
import { CLIENT_CONFIG_SOCKET_BASE_URL, CLIENT_SPRITES_RELATIVE_URL } from '../config';
import { DirectionalJoystickWrapper, DirectionalJoystickEvent } from '../DirectionalJoystickWrapper';
import { GamepadWrapper, GamepadWrapperEvent, GamepadWrapperEventData } from '../GamepadWrapper';
import { ColorUtils } from '@/utils/ColorUtils';
import { EntityId } from '@/ecs/EntityId';
import { Component, Vue, Watch } from 'vue-facing-decorator';
import { Entity } from '@/ecs/Entity';
import { EntityDrawables } from '@/entity/EntityDrawables';

@Component({
    options: {
        components: {
            'settings': Settings,
        },
    },
})
export default class App extends Vue {
    socket?: Socket<GameSocketEvents>;

    gameClient?: GameClient;
    gameClientSocket?: GameClientSocket;
    joystick?: DirectionalJoystickWrapper;
    isFullscreen = false;
    CLIENT_SPRITES_RELATIVE_URL = CLIENT_SPRITES_RELATIVE_URL;
    ColorUtils = ColorUtils;
    TankTier = TankTier;
    RenderPass = RenderPass;
    isUserShowingScoreboard = false;
    ownPlayer: Entity | null = null;
    playersStats: PlayerStats[] | null = null;
    canvases: HTMLCanvasElement[] = [];

    teams: Entity[] | null = null;
    tankId: EntityId | null = null;
    tankTier: TankTier | null = null;
    tankColor: Color | null = null;
    tankMaxHealth: number | null = null;
    tankHealth: number | null = null;
    tankMaxBullets: number | null = null;
    tankBullets: number | null = null;
    playerName: string | null = null;
    playerTeamId: string | null = null;
    playerRespawnTimeout: number | null = null;
    playerRequestedSpawnStatus = false;
    isUserShowingSettings = false;
    roundTimeSeconds = 0;
    isScoreboardWatchTime = false;

    async mounted(): Promise<void> {
        const canvasContainerElement = this.$refs.canvasContainerElement as HTMLDivElement;

        const socket = io(CLIENT_CONFIG_SOCKET_BASE_URL, {
            transports: ['websocket'],
            autoConnect: false,
        });
        this.socket = markRaw(socket);

        await EntityDrawables.load();

        const gameClient = new GameClient(this.canvases);
        this.gameClient = markRaw(gameClient);

        const gamepad = new GamepadWrapper();
        gamepad.emitter.on(GamepadWrapperEvent.CONTROLLER_EVENT, this.onControllerEvent);

        gameClient.emitter.on(GameClientEvent.ROUND_TIME_UPDATED,
            (roundTimeSeconds: number) => {
                this.roundTimeSeconds = roundTimeSeconds;
            });
        gameClient.emitter.on(GameClientEvent.PLAYERS_CHANGED,
            () => {
                this.updateScoreboard();
            });
        gameClient.emitter.on(GameClientEvent.TEAMS_CHANGED,
            () => {
                this.updateTeams();
            });
        gameClient.emitter.on(GameClientEvent.SCOREBOARD_WATCH_TIME,
            (value: boolean) => {
                this.isScoreboardWatchTime = value;
            });

        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_NAME,
            (name: string) => {
                this.playerName = name;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID,
            (tankId: EntityId | null) => {
                this.tankId = tankId;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID,
            (teamId: string | null) => {
                this.playerTeamId = teamId;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER,
            (tier: TankTier) => {
                this.tankTier = tier;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR,
            (color: Color) => {
                this.tankColor = color;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT,
            (respawnTimeout: number) => {
                this.playerRespawnTimeout = respawnTimeout;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS,
            (value: boolean) => {
                this.playerRequestedSpawnStatus = value;
            });

        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
            (maxHealth: number) => {
                this.tankMaxHealth = maxHealth;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
            (health: number) => {
                this.tankHealth = health;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
            (maxBullets: number) => {
                this.tankMaxBullets = maxBullets;
            });
        gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
            (bullets: number) => {
                this.tankBullets = bullets;
            });
        gameClient.emitter.on(GameClientEvent.TICK,
            () => {
                gamepad.processUpdates();
            });

        const gameClientSocket = new GameClientSocket(this.socket, this.gameClient);
        this.gameClientSocket = markRaw(gameClientSocket);

        const joystick = new DirectionalJoystickWrapper({
            zone: this.$refs.dpad as HTMLElement,
            threshold: 0.2,
        });
        joystick.on('dirdown', this.onJoystickEvent);
        joystick.on('dirup', this.onJoystickEvent);
        this.joystick = markRaw(joystick);

        window.addEventListener('resize', this.onWindowResize);
        canvasContainerElement.addEventListener('blur', this.onCanvasBlurEvent);
        canvasContainerElement.addEventListener('keydown', this.onKeyboardEvent);
        canvasContainerElement.addEventListener('keyup', this.onKeyboardEvent);

        const shootButton = this.$refs.shootButton as HTMLElement;
        shootButton.addEventListener('touchstart', this.onShootButtonTouchEvent);
        shootButton.addEventListener('touchend', this.onShootButtonTouchEvent);

        if (screenfull.isEnabled) {
            screenfull.on('change', this.onFullscreenChanged);
        }
    }

    get isPlayerDead(): boolean {
        return this.tankId === null;
    }

    get hasTeams(): boolean {
        return this.teams !== null && this.teams.length !== 0;
    }

    get tankMissingHearts(): number | null {
        if (this.tankMaxHealth === null || this.tankHealth === null) {
            return null;
        }

        return this.tankMaxHealth - this.tankHealth;
    }

    get tankMissingBullets(): number | null {
        if (this.tankMaxBullets === null || this.tankBullets === null) {
            return null;
        }

        return this.tankMaxBullets - this.tankBullets;
    }
 
    get roundTime(): string {
        const minutes = this.roundTimeSeconds / 60;
        const roundMinutes = Math.floor(minutes);
        const seconds = this.roundTimeSeconds % 60;
        const paddedSeconds = String(seconds).padStart(2, '0');
        return roundMinutes + ':' + paddedSeconds;
    }

    get isShowingSettings(): boolean {
        if (this.isPlayerDead) {
            return true;
        }

        return this.isUserShowingSettings;
    }

    get isShowingScoreboard(): boolean {
        if (this.isScoreboardWatchTime) {
            return true;
        }

        return this.isUserShowingScoreboard;
    }

    updateScoreboard(): void {
        if (this.gameClient === undefined || !this.isShowingScoreboard) {
            return;
        }

        this.playersStats = markRaw(this.gameClient.getStats());

        const ownPlayer = this.gameClient.getOwnPlayer();
        this.ownPlayer = ownPlayer ? markRaw(ownPlayer) : null;
    }

    @Watch('isShowingScoreboard')
    onScoreboardShownChanged(): void {
        if (this.isShowingScoreboard) {
            this.updateScoreboard();
        }
    }

    @Watch('isShowingSettings')
    onSettingsShownChanged(): void {
        if (this.isShowingSettings) {
            this.onSettingsShown();
        } else {
            this.onSettingsHidden();
        }
    }

    onSettingsHidden(): void {
        const canvasContainerElement = this.$refs.canvasContainerElement as HTMLElement;
        canvasContainerElement.focus();
    }

    onSettingsShown(): void {
        this.isUserShowingScoreboard = false;
        this.$nextTick(() => {
            const settingsElement = (this.$refs.settingsElement as any).$el as HTMLElement;
            settingsElement.focus();
        });
    }

    addCanvasRef(canvas: HTMLCanvasElement): void {
        this.canvases.push(canvas);
    }

    updateTeams(): void {
        if (this.gameClient === undefined) {
            return;
        }

        const teams = this.gameClient.getTeams();
        this.teams = teams ? markRaw(teams) : null;
    }

    clearPlayers(): void {
        this.playersStats = null;
        this.ownPlayer = null;
    }

    onFullscreenChanged(): void {
        if (screenfull.isEnabled) {
            this.isFullscreen = screenfull.isFullscreen;
        }
    }

    onKeyboardEvent(event: KeyboardEvent): void {
        const lowerKey = event.key.toLowerCase();
        let repeated = event.repeat;
        let handled = false;

        if (lowerKey === 'tab') {
            if (!repeated) {
                if (event.type === 'keydown') {
                    this.isUserShowingScoreboard = true;
                }

                if (event.type === 'keyup') {
                    this.isUserShowingScoreboard = false;
                }
            }

            handled = true;
        }

        if (!repeated && lowerKey === 'escape') {
            if (event.type === 'keyup') {
                this.isUserShowingSettings = !this.isUserShowingSettings;
            }

            handled = true;
        }

        if (!repeated) {
            const action = ActionFactory.buildFromKeyboardEvent(event);
            if (action !== undefined) {
                this.gameClientSocket?.requestPlayerAction(action);
                handled = true;
            }
        }

        if (handled) {
            event.preventDefault();
        }
    }

    onShootButtonTouchEvent(event: TouchEvent): void {
        const action = ActionFactory.buildFromShootButtonTouchEvent(event.type);
        if (action === undefined) {
            return;
        }

        this.gameClientSocket?.requestPlayerAction(action);
        event.preventDefault();
    }

    onJoystickEvent(event: DirectionalJoystickEvent): void {
        const action = ActionFactory.buildFromJoystickEvent(event.type, event.angle);
        if (action === undefined) {
            return;
        }

        this.gameClientSocket?.requestPlayerAction(action);
    }

    onControllerEvent(event: GamepadWrapperEventData): void {
        const action = ActionFactory.buildFromControllerEvent(event);
        if (action === undefined) {
            return;
        }

        this.gameClientSocket?.requestPlayerAction(action);
    }

    beforeUnmount(): void {
        this.socket?.disconnect();
    }

    onWindowResize(): void {
        this.gameClient?.onWindowResize();
    }

    onCanvasBlurEvent(): void {
        const action = ActionFactory.buildAllUnpressEvent();
        this.gameClientSocket?.requestPlayerAction(action);
    }

    onSpawnButtonClick(): void {
        this.gameClientSocket?.requestPlayerTankSpawn();
    }

    onTankColorChanged(color: Color): void {
        this.gameClientSocket?.requestPlayerTankColor(color);
    }

    onPlayerColorChanged(tier: TankTier): void {
        this.gameClientSocket?.requestPlayerTankTier(tier);
    }

    onPlayerTeamChanged(teamId: string): void {
        this.gameClientSocket?.requestPlayerTeam(teamId);
    }

    onPlayerNameChanged(name: string): void {
        this.gameClientSocket?.setPlayerName(name);
    }

    onFullscreenButtonClick(): void {
        if (screenfull.isEnabled) {
            screenfull.toggle();
        }
    }
}
</script>

<style>
#app-content {
    width: 100%;
    height: 100%;

    font-family: 'Press Start 2P';

    user-select: none;
}

#game-canvas-container {
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    background: #000000;

    outline: none;

    z-index: 1;
}

.game-canvas {
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    z-index: 2;
}

#game-settings {
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    z-index: 4;
}

#game-overlay {
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    z-index: 3;

    pointer-events: none;
}

#game-overlay > * {
    pointer-events: all;
}

.controls {
    background: rgba(0, 0, 0, 0.75);
    color: #ffffff;
}

.image-button {
    padding: 8px;
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
    cursor: pointer;
}

#game-controls {
    position: absolute;
    top: 0;
    left: 0;
}

#game-controls .color {
    display: inline-block;
    height: 16px;
    width: 16px;
}

#fullscreen-controls {
    position: absolute;
    top: 0;
    right: 0;

    border-bottom-left-radius: 12px;

    display: none;
}

#stats-container {
    display: flex;
    justify-content: center;
    align-items: center;

    height: 100%;
    padding: 16px;
}

#stats {
    padding: 16px;
    font-size: 12px;
}

#stats table {
    border-collapse: collapse;
    border-style: hidden;
}

#stats table tr.is-own-player {
    background: rgba(255, 255, 255, 0.25);
}

#stats table td {
    padding: 4px 8px;
}

#stats table .header td {
  border: 2px solid #ffffff;
}

#stats table td.color-cell {
    display: flex;
    justify-content: center;
    align-items: center;
}

#stats table td .color {
    height: 16px;
    width: 16px;
}

#virtual-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;

    display: none;
}

#virtual-dpad {
    position: relative;

    width: 70%;
    height: 100%;
}

#virtual-shoot-button {
    width: 50%;
    height: 100%;
}

#building-controls {
    position: absolute;
    right: 0;
    bottom: 0;
    top: 0;

    padding: 8px;
}

#tank-stats,
#round-time {
    position: absolute;
    display: flex;
    color: #ffffff;
}

#tank-stats {
    left: 16px;
    bottom: 16px;
}

#round-time {
    width: 100%;
    top: 16px;

    justify-content: center;
}

.tank-stats-group,
.round-time-group {
    padding: 8px;

    background: rgba(255, 255, 255, 0.45);
    border-radius: 5px;
}

.tank-stats-group label {
    display: block;
    margin-bottom: 8px;
}

.tank-stats-group + .tank-stats-group {
    margin-left: 16px;
}

.tank-stats-icon {
    width: 32px;
    height: 32px;
    margin-right: 4px;
    image-rendering: pixelated;
}

@media (pointer: coarse) {
    #virtual-controls {
        display: flex;
    }

    #fullscreen-controls {
        display: block;
    }
}
</style>
