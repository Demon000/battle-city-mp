<template>
    <div id="app-content">
        <canvas
            id="game-canvas"
            ref="canvas"
        ></canvas>
        <div id="game-overlay">
            <div id="game-controls">
                <button
                    @click="onSpawnButtonClick"
                >Spawn</button>
                <button
                    @click="onDespawnButtonClick"
                >Despawn</button>
                <span>
                    R
                    <input
                        type="range" min="0" max="255"
                        v-model="playerColor[0]"
                        @change="onPlayerColorChanged"
                    >
                </span>

                <span>
                    G
                    <input
                        type="range" min="0" max="255"
                        v-model="playerColor[1]"
                        @change="onPlayerColorChanged"
                    >
                </span>

                <span>
                    B
                    <input
                        type="range" min="0" max="255"
                        v-model="playerColor[2]"
                        @change="onPlayerColorChanged"
                    >
                </span>

                <button
                    v-for="tier in Object.values(TankTier)"
                    :key="tier"
                    @click="onPlayerTierClick(tier)"
                >
                    {{ tier }}
                </button>
            </div>

            <div id="fullscreen-controls">
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

export default class App extends Vue {
    socket?: Socket;
    gameClient?: GameClient;
    gameClientSocket?: GameClientSocket;
    joystick?: DirectionalJoystickWrapper;
    isFullscreen = false;
    CLIENT_SPRITES_RELATIVE_URL = CLIENT_SPRITES_RELATIVE_URL;
    TankTier = TankTier;
    playerColor = [0, 0, 0];

    mounted(): void {
        const canvas = this.$refs.canvas as HTMLCanvasElement;

        this.socket = io(CLIENT_CONFIG_SOCKET_BASE_URL, {
            transports: ['websocket'],
        });
        this.gameClient = new GameClient(canvas);
        this.gameClientSocket = new GameClientSocket(this.socket, this.gameClient);
        this.joystick = new DirectionalJoystickWrapper({
            zone: this.$refs.dpad as HTMLElement,
        });

        window.addEventListener('resize', this.onWindowResize);
        window.addEventListener('keydown', this.onKeyboardEvent);
        window.addEventListener('keyup', this.onKeyboardEvent);
        window.addEventListener('contextmenu', (e: Event) => e.preventDefault());

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
        if (!this.gameClientSocket) {
            return;
        }

        if (event.repeat) {
            return;
        }

        const action = ActionFactory.buildFromEvent(event);
        if (action === undefined) {
            return;
        }

        this.gameClientSocket.requestPlayerAction(action);
    }

    onShootButtonTouchEvent(event: TouchEvent): void {
        const action = ActionFactory.buildFromShootButtonTouchEvent(event.type);
        if (action === undefined) {
            return;
        }

        this.gameClientSocket?.requestPlayerAction(action);
    }

    onJoystickEvent(event: DirectionalJoystickEvent): void {
        if (!this.gameClientSocket) {
            return;
        }

        const action = ActionFactory.buildFromJoystickEvent(event.type, event.angle);
        if (action === undefined) {
            return;
        }

        this.gameClientSocket.requestPlayerAction(action);
    }

    beforeUnmount(): void {
        this.socket?.disconnect();
    }

    onWindowResize(): void {
        if (this.gameClient) {
            this.gameClient.onWindowResize();
        }
    }

    onSpawnButtonClick(): void {
        if (this.gameClientSocket !== undefined) {
            this.gameClientSocket.requestPlayerTankSpawn();
        }
    }

    onDespawnButtonClick(): void {
        if (this.gameClientSocket !== undefined) {
            this.gameClientSocket.requestPlayerTankDespawn();
        }
    }

    onPlayerColorChanged(): void {
        if (this.gameClientSocket !== undefined) {
            this.gameClientSocket.requestPlayerTankColor(this.playerColor[0],
                this.playerColor[1], this.playerColor[2]);
        }
    }

    onPlayerTierClick(tier: TankTier): void {
        if (this.gameClientSocket !== undefined) {
            this.gameClientSocket.requestPlayerTankTier(tier);
        }
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
    background: rgba(0, 0, 0, 0.25);

    color: #ffffff;
}

#fullscreen-controls {
    position: absolute;
    top: 0;
    right: 0;

    background: rgba(0, 0, 0, 0.25);
    border-bottom-left-radius: 12px;
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

@media (pointer: coarse) {
    #virtual-controls {
        display: flex;
    }
}
</style>
