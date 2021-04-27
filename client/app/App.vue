<template>
    <div id="app-content">
        <div
            id="game-canvas-container"
            ref="canvasContainer"
            tabindex="1"
        >
            <canvas
                class="game-canvas"
                v-for="index in RenderPass.MAX"
                :key="index"
                :ref="addCanvasRef"
            ></canvas>
        </div>

        <div id="game-overlay">
            <div id="game-controls" class="controls">
                <button
                    @click="onSpawnButtonClick"
                >Spawn</button>
                <button
                    @click="onDespawnButtonClick"
                >Despawn</button>
                <label>Name</label>
                <input
                    type="text"
                    v-model="playerName"
                    @change="onPlayerNameChanged"
                >
                <label>Color</label>
                <input
                    type="color"
                    v-model="playerColor"
                    @change="onPlayerColorChanged"
                >

                <button
                    v-for="tier in Object.values(TankTier)"
                    :key="tier"
                    @click="onPlayerTierClick(tier)"
                >
                    {{ tier }}
                </button>
            </div>

            <div id="fullscreen-controls" class="controls">
                <img
                    class="image-button"
                    :src="`${CLIENT_SPRITES_RELATIVE_URL}/fullscreen_button.png`"
                    alt="Enter fullscreen"
                    v-if="!isFullscreen"
                    @click="onFullscreenButtonClick"
                >

                <img
                    class="image-button"
                    :src="`${CLIENT_SPRITES_RELATIVE_URL}/fullscreen_exit_button.png`"
                    alt="Exit fullscreen"
                    v-if="isFullscreen"
                    @click="onFullscreenButtonClick"
                >
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
                v-if="isStatsOpen"
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
                        </tr>
                        <tr
                            v-for="player of players"
                            :key="player.id"
                            :class="{
                                'is-own-player': player.id === ownPlayer.id,
                            }"
                        >
                            <td>{{ player.displayName }}</td>
                            <td>{{ player.kills }}</td>
                            <td>{{ player.deaths }}</td>
                            <td>{{ player.points }}</td>
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
</template>

<script lang="ts">
import ActionFactory from '@/actions/ActionFactory';
import GameClient, { GameClientEvent } from '@/game/GameClient';
import GameClientSocket from '@/game/GameClientSocket';
import { GameSocketEvents } from '@/game/GameSocketEvent';
import { GameMapGridSizes } from '@/maps/GameMapGridSizes';
import { GameObjectType, GameShortObjectType } from '@/object/GameObjectType';
import { RenderPass } from '@/object/RenderPass';
import Player from '@/player/Player';
import { TankTier } from '@/tank/TankTier';
import screenfull from 'screenfull';
import { io, Socket } from 'socket.io-client';
import { markRaw } from 'vue';
import { Vue } from 'vue-class-component';
import { CLIENT_CONFIG_SOCKET_BASE_URL, CLIENT_SPRITES_RELATIVE_URL } from '../../config';
import DirectionalJoystickWrapper, { DirectionalJoystickEvent } from '../DirectionalJoystickWrapper';

export default class App extends Vue {
    socket?: Socket<GameSocketEvents>;
    gameClient?: GameClient;
    gameClientSocket?: GameClientSocket;
    joystick?: DirectionalJoystickWrapper;
    isFullscreen = false;
    CLIENT_SPRITES_RELATIVE_URL = CLIENT_SPRITES_RELATIVE_URL;
    GameMapGridSizes = GameMapGridSizes;
    GameShortObjectType = GameShortObjectType;
    GameObjectType = GameObjectType;
    TankTier = TankTier;
    RenderPass = RenderPass;
    playerColor = '';
    playerName = '';
    isBuilding = false;
    isStatsOpen = false;
    gridSize = 0;
    selectedObjectType = GameObjectType.NONE;
    ownPlayer: Player | null = null;
    players: Player[] | null = null;
    canvases: HTMLCanvasElement[] = [];

    mounted(): void {
        const canvasContainer = this.$refs.canvasContainer as HTMLDivElement;

        this.socket = io(CLIENT_CONFIG_SOCKET_BASE_URL, {
            transports: ['websocket'],
            autoConnect: false,
        });
        this.gameClient = new GameClient(this.canvases);
        this.gameClient.emitter.on(GameClientEvent.PLAYERS_CHANGED, () => {
            this.updatePlayers();
        });

        this.gameClientSocket = new GameClientSocket(this.socket, this.gameClient);
        this.joystick = new DirectionalJoystickWrapper({
            zone: this.$refs.dpad as HTMLElement,
            dataOnly: true,
        });

        window.addEventListener('resize', this.onWindowResize);
        window.addEventListener('keydown', this.onNonGameKeyboardEvent);
        window.addEventListener('keyup', this.onNonGameKeyboardEvent);
        canvasContainer.addEventListener('blur', this.onCanvasBlurEvent);
        canvasContainer.addEventListener('keydown', this.onKeyboardEvent);
        canvasContainer.addEventListener('keyup', this.onKeyboardEvent);
        canvasContainer.addEventListener('mousemove', this.onMouseMoveEvent, {
            passive: true,
        });
        canvasContainer.addEventListener('click', this.onMouseClickEvent);
        canvasContainer.addEventListener('contextmenu', this.onMouseRightClickEvent);
        canvasContainer.focus();

        const shootButton = this.$refs.shootButton as HTMLElement;
        shootButton.addEventListener('touchstart', this.onShootButtonTouchEvent);
        shootButton.addEventListener('touchend', this.onShootButtonTouchEvent);

        this.joystick.on('dirdown', this.onJoystickEvent);
        this.joystick.on('dirup', this.onJoystickEvent);

        if (screenfull.isEnabled) {
            screenfull.on('change', this.onFullscreenChanged);
        }
    }

    addCanvasRef(canvas: HTMLCanvasElement): void {
        this.canvases.push(canvas);
    }

    updatePlayers(): void {
        if (this.gameClient === undefined || !this.isStatsOpen) {
            return;
        }

        this.players = markRaw(this.gameClient.getPlayers());

        const ownPlayer = this.gameClient.getOwnPlayer();
        this.ownPlayer = ownPlayer ? markRaw(ownPlayer) : null;
    }

    clearPlayers(): void {
        this.players = null;
        this.ownPlayer = null;
    }

    onFullscreenChanged(): void {
        if (screenfull.isEnabled) {
            this.isFullscreen = screenfull.isFullscreen;
        }
    }

    onKeyboardEvent(event: KeyboardEvent): void {
        if (event.repeat) {
            return;
        }

        const action = ActionFactory.buildFromKeyboardEvent(event);
        if (action !== undefined) {
            this.gameClientSocket?.requestPlayerAction(action);
            return;
        }
    }

    onNonGameKeyboardEvent(event: KeyboardEvent): void {
        if (event.key.toLowerCase() === 'b' && event.type === 'keyup') {
            this.isBuilding = !this.isBuilding;
            this.gameClientSocket?.mapEditorEnable(this.isBuilding);
            return;
        }

        if (event.key.toLowerCase() === 'tab') {
            if (event.type === 'keydown') {
                this.isStatsOpen = true;
                this.updatePlayers();
            }

            if (event.type === 'keyup') {
                this.isStatsOpen = false;
                this.clearPlayers();
            }

            event.preventDefault();

            return;
        }
    }

    onShootButtonTouchEvent(event: TouchEvent): void {
        const action = ActionFactory.buildFromShootButtonTouchEvent(event.type);
        if (action === undefined) {
            return;
        }

        this.gameClientSocket?.requestPlayerAction(action);
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

    onPlayerColorChanged(): void {
        const r = parseInt(this.playerColor.substr(1, 2), 16);
        const g = parseInt(this.playerColor.substr(3, 2), 16);
        const b = parseInt(this.playerColor.substr(5, 2), 16);
        this.gameClientSocket?.requestPlayerTankColor(r, g, b);
    }

    onPlayerTierClick(tier: TankTier): void {
        this.gameClientSocket?.requestPlayerTankTier(tier);
    }

    onPlayerNameChanged(): void {
        this.gameClientSocket?.setPlayerName(this.playerName);
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

    focusCanvasContainer(): boolean {
        const canvasContainer = this.$refs.canvasContainer as HTMLDivElement;
        if (document.activeElement !== canvasContainer) {
            canvasContainer.focus();
            return true;
        }

        return false;
    }

    onMouseMoveEvent(event: MouseEvent): void {
        const focused = this.focusCanvasContainer();
        if (focused) {
            return;
        }

        this.gameClient?.setMapEditorHoverPosition({
            x: event.offsetX,
            y: event.offsetY,
        });
    }

    onMouseClickEvent(): void {
        const focused = this.focusCanvasContainer();
        if (focused) {
            return;
        }

        if (this.isBuilding) {
            this.gameClientSocket?.mapEditorCreateObjects();
        }
    }

    onMouseRightClickEvent(event: MouseEvent): void {
        event.preventDefault();

        const focused = this.focusCanvasContainer();
        if (focused) {
            return;
        }

        if (this.isBuilding) {
            this.gameClientSocket?.mapEditorDestroyObjects({
                x: event.offsetX,
                y: event.offsetY,
            });
        }
    }

    onSaveButtonClick(): void {
        this.gameClientSocket?.saveMap();
    }
}
</script>

<style>
#app-content {
    user-select: none;
}

#app-content,
button {
    font-family: 'Press Start 2P';
}

#app-content,
#game-canvas-container,
#game-overlay,
.game-canvas {
    width: 100%;
    height: 100%;
}

#game-canvas-container {
    background: #000000;

    outline: none;
}

#game-overlay,
.game-canvas {
    position: absolute;
    top: 0;
    left: 0;
}

#game-overlay {
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

@media (pointer: coarse) {
    #virtual-controls {
        display: flex;
    }

    #fullscreen-controls {
        display: block;
    }
}
</style>
