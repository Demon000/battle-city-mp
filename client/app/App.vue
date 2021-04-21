<template>
    <div id="app-content">
        <canvas
            id="game-canvas"
            ref="canvas"
            tabindex="1"
        ></canvas>

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
import GameClientSocket from '@/game/GameClientSocket';
import { CLIENT_CONFIG_SOCKET_BASE_URL, CLIENT_SPRITES_RELATIVE_URL } from '../../config';
import { Vue } from 'vue-class-component';
import GameClient from '@/game/GameClient';
import { io, Socket } from 'socket.io-client';
import ActionFactory from '@/actions/ActionFactory';
import DirectionalJoystickWrapper, { DirectionalJoystickEvent } from '../DirectionalJoystickWrapper';
import screenfull from 'screenfull';
import { TankTier } from '@/tank/TankTier';
import { GameMapGridSizes } from '@/maps/GameMapGridSizes';
import { GameObjectType, GameShortObjectType } from '@/object/GameObjectType';
import { GameSocketEvents } from '@/game/GameSocketEvent';

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
    playerColor = '';
    playerName = '';
    isBuilding = false;
    gridSize = 0;
    selectedObjectType = GameObjectType.NONE;

    mounted(): void {
        const canvas = this.$refs.canvas as HTMLCanvasElement;

        this.socket = io(CLIENT_CONFIG_SOCKET_BASE_URL, {
            transports: ['websocket'],
            autoConnect: false,
        });
        this.gameClient = new GameClient(canvas);
        this.gameClientSocket = new GameClientSocket(this.socket, this.gameClient);
        this.joystick = new DirectionalJoystickWrapper({
            zone: this.$refs.dpad as HTMLElement,
        });

        window.addEventListener('resize', this.onWindowResize);
        canvas.addEventListener('blur', this.onCanvasBlurEvent);
        canvas.addEventListener('keydown', this.onKeyboardEvent);
        canvas.addEventListener('keyup', this.onKeyboardEvent);
        canvas.addEventListener('mousemove', this.onMouseMoveEvent, {
            passive: true,
        });
        canvas.addEventListener('click', this.onMouseClickEvent);
        canvas.addEventListener('contextmenu', this.onMouseRightClickEvent);
        canvas.focus();

        const shootButton = this.$refs.shootButton as HTMLElement;
        shootButton.addEventListener('touchstart', this.onShootButtonTouchEvent);
        shootButton.addEventListener('touchend', this.onShootButtonTouchEvent);

        this.joystick.on('dirdown', this.onJoystickEvent);
        this.joystick.on('dirup', this.onJoystickEvent);

        if (screenfull.isEnabled) {
            screenfull.on('change', this.onFullscreenChanged);
        }
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

        if (event.key.toLowerCase() === 'b' && event.type === 'keyup') {
            this.isBuilding = !this.isBuilding;
            this.gameClient?.setMapEditorEnabled(this.isBuilding);
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

    focusCanvas(): boolean {
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        if (document.activeElement !== canvas) {
            canvas.focus();
            return true;
        }

        return false;
    }

    onMouseMoveEvent(event: MouseEvent): void {
        const canvasFocused = this.focusCanvas();
        if (canvasFocused) {
            return;
        }

        this.gameClient?.setMapEditorHoverPosition({
            x: event.offsetX,
            y: event.offsetY,
        });
    }

    onMouseClickEvent(): void {
        const canvasFocused = this.focusCanvas();
        if (canvasFocused) {
            return;
        }

        if (this.isBuilding) {
            this.gameClient?.createMapEditorObjects();
        }
    }

    onMouseRightClickEvent(event: MouseEvent): void {
        event.preventDefault();

        const canvasFocused = this.focusCanvas();
        if (canvasFocused) {
            return;
        }

        if (this.isBuilding) {
            this.gameClient?.destroyMapEditorObjects({
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
    width: 100%;
    height: 100%;
    user-select: none;
}

#game-canvas {
    width: 100%;
    height: 100%;
}

#game-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

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
