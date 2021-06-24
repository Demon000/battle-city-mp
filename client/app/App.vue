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
                        :src="WebpackUtils.getImageUrl('fullscreen_button')"
                        alt="Enter fullscreen"
                        v-if="!isFullscreen"
                        @click="onFullscreenButtonClick"
                    >

                    <img
                        class="image-button"
                        :src="WebpackUtils.getImageUrl('fullscreen_exit_button')"
                        alt="Exit fullscreen"
                        v-if="isFullscreen"
                        @click="onFullscreenButtonClick"
                    >
                </div>

                <div
                    id="tank-stats"
                    v-if="!isTankDead"
                >
                    <div class="tank-stats-group">
                        <label>Health</label>
                        <div>
                            <img
                                class="tank-stats-icon"
                                v-for="i in tankHealth"
                                :key="i"
                                :src="WebpackUtils.getImageUrl('heart_full')"
                            >
                            <img
                                class="tank-stats-icon"
                                v-for="i in tankMissingHearts"
                                :key="i"
                                :src="WebpackUtils.getImageUrl('heart_empty')"
                            >
                        </div>
                    </div>

                    <div class="tank-stats-group">
                        <label>Bullets</label>
                        <div class="tank-bullet">
                            <img
                                class="tank-stats-icon"
                                v-for="i in tankMissingBullets"
                                :key="i"
                                :src="WebpackUtils.getImageUrl('bullet_full')"
                            >
                            <img
                                class="tank-stats-icon"
                                v-for="i in tankBullets"
                                :key="i"
                                :src="WebpackUtils.getImageUrl('bullet_empty')"
                            >
                        </div>
                    </div>
                </div>

                <div
                    id="building-controls"
                    class="controls"
                    v-if="isBuilding"
                >
                    <label>Grid size</label>
                    <br>
                    <select
                        @change="onGridSizeChanged"
                        v-model="gridSize"
                    >
                        <option
                            v-for="size in GameMapGridSizes"
                            :key="size"
                            :value="size"
                        >
                            {{ size }}
                        </option>
                    </select>

                    <br>

                    <label>Block type</label>
                    <br>
                    <select
                        @change="onSelectedObjectTypeChanged"
                        v-model="selectedObjectType"
                    >
                        <option
                            v-for="type in Object.keys(GameShortObjectType)"
                            :key="type"
                            :value="GameObjectType[type]"
                        >
                            {{ type }}
                        </option>
                    </select>

                    <br>

                    <button
                        @click="onSaveButtonClick"
                    >
                        Save
                    </button>
                </div>

                <div
                    id="stats-container"
                    v-if="isShowingStats"
                >
                    <div
                        id="stats"
                        class="controls"
                    >
                        <table>
                            <tr class="header">
                                <td>Player name</td>
                                <td>Kills</td>
                                <td>Deaths</td>
                                <td>Points</td>
                                <td
                                    v-if="hasTeams"
                                >
                                    Team
                                </td>
                                <td>Tank</td>
                            </tr>
                            <tr
                                v-for="{player, team, tier} of playersStats"
                                :key="player.id"
                                :class="{
                                    'is-own-player': player.id === ownPlayer.id,
                                }"
                            >
                                <td>{{ player.displayName }}</td>
                                <td>{{ player.kills }}</td>
                                <td>{{ player.deaths }}</td>
                                <td>{{ player.points }}</td>
                                <td
                                    class="team-cell"
                                    v-if="hasTeams"
                                >
                                    <template
                                        v-if="team"
                                    >
                                        <span
                                            class="team-color"
                                            :style="{
                                                background: ColorUtils.getRgbFromColor(team.color),
                                            }"
                                        >
                                        </span>
                                    </template>
                                </td>
                                <td>
                                    {{ tier }}
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
            :tankTier="tankTier"
            :tankColor="tankColor"
            :playerTeamId="playerTeamId"
            :hasTankDiedOnce="hasTankDiedOnce"
            :isTankDead="isTankDead"
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
import { GameMapGridSizes } from '@/maps/GameMapGridSizes';
import { GameObjectType, GameShortObjectType } from '@/object/GameObjectType';
import { RenderPass } from '@/object/RenderPass';
import { Player, PlayerSpawnStatus } from '@/player/Player';
import { PlayerStats } from '@/player/PlayerStats';
import { TankTier } from '@/tank/TankTier';
import { Team } from '@/team/Team';
import { RatioUtils } from '@/utils/RatioUtils';
import screenfull from 'screenfull';
import { io, Socket } from 'socket.io-client';
import { markRaw } from 'vue';
import { Options } from 'vue-class-component';
import { CLIENT_CONFIG_SOCKET_BASE_URL, CLIENT_SPRITES_RELATIVE_URL } from '../../config';
import { DirectionalJoystickWrapper, DirectionalJoystickEvent } from '../DirectionalJoystickWrapper';
import { ColorUtils } from '@/utils/ColorUtils';
import { Vue } from 'vue-property-decorator';
import { WebpackUtils } from '../utils/WebpackUtils';

@Options({
    components: {
        'settings': Settings,
    },
})
export default class App extends Vue {
    WebpackUtils = WebpackUtils;
    socket?: Socket<GameSocketEvents>;

    gameClient?: GameClient;
    gameClientSocket?: GameClientSocket;
    joystick?: DirectionalJoystickWrapper;
    isFullscreen = false;
    CLIENT_SPRITES_RELATIVE_URL = CLIENT_SPRITES_RELATIVE_URL;
    ColorUtils = ColorUtils;
    GameMapGridSizes = GameMapGridSizes;
    GameShortObjectType = GameShortObjectType;
    GameObjectType = GameObjectType;
    TankTier = TankTier;
    RenderPass = RenderPass;
    isBuilding = false;
    isShowingStats = false;
    gridSize = 0;
    selectedObjectType = GameObjectType.NONE;
    ownPlayer: Player | null = null;
    playersStats: PlayerStats[] | null = null;
    canvases: HTMLCanvasElement[] = [];

    teams: Team[] | null = null;
    tankTier: TankTier | null = null;
    tankColor: Color | null = null;
    tankMaxHealth: number | null = null;
    tankHealth: number | null = null;
    tankMaxBullets: number | null = null;
    tankBullets: number | null = null;
    playerTeamId: string | null = null;
    playerRespawnTimeout: number | null = null;
    playerRequestedSpawnStatus: PlayerSpawnStatus | null = null;
    hasTankDiedOnce = false;
    isTankDead = true;
    isShowingSettings = false;

    mounted(): void {
        const canvasContainerElement = this.$refs.canvasContainerElement as HTMLDivElement;

        this.socket = io(CLIENT_CONFIG_SOCKET_BASE_URL, {
            transports: ['websocket'],
            autoConnect: false,
        });
        this.gameClient = new GameClient(this.canvases);
        this.gameClient.emitter.on(GameClientEvent.PLAYERS_CHANGED, () => {
            this.updatePlayers();
        });
        this.gameClient.emitter.on(GameClientEvent.TEAMS_CHANGED, () => {
            this.updateTeams();
        });
        this.gameClient.emitter.on(GameClientEvent.MAP_EDITOR_ENABLED_CHANGED, (enabled: boolean) => {
            this.isBuilding = enabled;
        });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_ADDED, () => {
            this.showSettings();
        });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TANK_ID,
            (tankId: number | null) => {
                this.isTankDead = tankId === null;

                if (tankId === null) {
                    this.showSettings();
                } else {
                    this.hideSettings();
                }

                if (tankId === null && !this.hasTankDiedOnce) {
                    this.hasTankDiedOnce = true;
                }
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TEAM_ID,
            (teamId: string | null) => {
                this.playerTeamId = teamId;
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TANK_TIER,
            (tier: TankTier) => {
                this.tankTier = tier;
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_TANK_COLOR,
            (color: Color) => {
                this.tankColor = color;
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_RESPAWN_TIMEOUT,
            (respawnTimeout: number) => {
                this.playerRespawnTimeout = respawnTimeout;
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_CHANGED_REQUESTED_SPAWN_STATUS,
            (requestedSpawnStatus: PlayerSpawnStatus) => {
                this.playerRequestedSpawnStatus = requestedSpawnStatus;
            });

        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_HEALTH,
            (maxHealth: number) => {
                this.tankMaxHealth = maxHealth;
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_HEALTH,
            (health: number) => {
                this.tankHealth = health;
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_MAX_BULLETS,
            (maxBullets: number) => {
                this.tankMaxBullets = maxBullets;
            });
        this.gameClient.emitter.on(GameClientEvent.OWN_PLAYER_TANK_CHANGED_BULLETS,
            (bullets: number) => {
                this.tankBullets = bullets;
            });

        this.gameClientSocket = new GameClientSocket(this.socket, this.gameClient);
        this.joystick = new DirectionalJoystickWrapper({
            zone: this.$refs.dpad as HTMLElement,
            threshold: 0.2,
        });

        window.addEventListener('resize', this.onWindowResize);
        canvasContainerElement.addEventListener('blur', this.onCanvasBlurEvent);
        canvasContainerElement.addEventListener('keydown', this.onKeyboardEvent);
        canvasContainerElement.addEventListener('keyup', this.onKeyboardEvent);
        canvasContainerElement.addEventListener('click', this.onMouseClickEvent);
        canvasContainerElement.addEventListener('contextmenu', this.onMouseRightClickEvent);
        canvasContainerElement.addEventListener('mousemove', this.onMouseMoveEvent, {
            passive: true,
        });

        const shootButton = this.$refs.shootButton as HTMLElement;
        shootButton.addEventListener('touchstart', this.onShootButtonTouchEvent);
        shootButton.addEventListener('touchend', this.onShootButtonTouchEvent);

        this.joystick.on('dirdown', this.onJoystickEvent);
        this.joystick.on('dirup', this.onJoystickEvent);

        if (screenfull.isEnabled) {
            screenfull.on('change', this.onFullscreenChanged);
        }
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

    hideSettings(): void {
        this.isShowingSettings = false;
        const canvasContainerElement = this.$refs.canvasContainerElement as HTMLElement;
        canvasContainerElement.focus();
    }

    showSettings(): void {
        this.isShowingSettings = true;
        this.isShowingStats = false;
        this.$nextTick(() => {
            const settingsElement = (this.$refs.settingsElement as Vue).$el as HTMLElement;
            settingsElement.focus();
        });
    }

    toggleSettings(): void {
        if (this.isShowingSettings) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }

    addCanvasRef(canvas: HTMLCanvasElement): void {
        this.canvases.push(canvas);
    }

    updatePlayers(): void {
        if (this.gameClient === undefined || !this.isShowingStats) {
            return;
        }

        this.playersStats = markRaw(this.gameClient.getPlayersStats());

        const ownPlayer = this.gameClient.getOwnPlayer();
        this.ownPlayer = ownPlayer ? markRaw(ownPlayer) : null;
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

        if (!repeated && lowerKey === 'b') {
            if (event.type === 'keyup') {
                this.gameClientSocket?.toggleMapEditor();
            }

            handled = true;
        }

        if (lowerKey === 'tab') {
            if (!repeated) {
                if (event.type === 'keydown') {
                    this.isShowingStats = true;
                    this.updatePlayers();
                }

                if (event.type === 'keyup') {
                    this.isShowingStats = false;
                    this.clearPlayers();
                }
            }

            handled = true;
        }

        if (!repeated && lowerKey === 'escape') {
            if (event.type === 'keyup') {
                this.toggleSettings();
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

    onDespawnButtonClick(): void {
        this.gameClientSocket?.requestPlayerTankDespawn();
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

    onGridSizeChanged(): void {
        this.gameClient?.setMapEditorGridSize(this.gridSize);
    }

    onSelectedObjectTypeChanged(): void {
        this.gameClient?.setMapEditorSelectedObjectType(this.selectedObjectType);
    }

    onMouseMoveEvent(event: MouseEvent): void {
        this.gameClient?.setMapEditorHoverPosition({
            x: RatioUtils.scaleForDevicePixelRatio(event.offsetX),
            y: RatioUtils.scaleForDevicePixelRatio(event.offsetY),
        });
    }

    onMouseClickEvent(): void {
        if (this.isBuilding) {
            this.gameClientSocket?.mapEditorCreateObjects();
        }
    }

    onMouseRightClickEvent(event: MouseEvent): void {
        if (this.isBuilding) {
            this.gameClientSocket?.mapEditorDestroyObjects({
                x: RatioUtils.scaleForDevicePixelRatio(event.offsetX),
                y: RatioUtils.scaleForDevicePixelRatio(event.offsetY),
            });
        }

        event.preventDefault();
    }

    onSaveButtonClick(): void {
        this.gameClientSocket?.saveMap();
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

#game-controls .team-color {
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

#stats table td.team-cell {
    display: flex;
    justify-content: center;
    align-items: center;
}

#stats table td .team-color {
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

#tank-stats {
    position: absolute;
    left: 16px;
    bottom: 16px;

    display: flex;

    color: #ffffff;
}

.tank-stats-group {
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
