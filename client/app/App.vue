<template>
    <div id="app-content">
        <canvas
            id="game-canvas"
            ref="canvas"
        ></canvas>
        <div id="game-overlay">
            <button
                @click="onSpawnButtonClick"
            >Spawn</button>
        </div>
    </div>
</template>

<script lang="ts">
import GameClientSocket from '@/game/GameClientSocket';
import { CLIENT_CONFIG_SOCKET_BASE_URL } from '../../config';
import { Vue } from 'vue-class-component';
import GameClient from '@/game/GameClient';
import { io, Socket } from 'socket.io-client';
import ActionFactory from '@/actions/ActionFactory';

export default class App extends Vue {
    socket?: Socket;
    gameClient?: GameClient;
    gameClientSocket?: GameClientSocket;

    mounted(): void {
        this.socket = io(CLIENT_CONFIG_SOCKET_BASE_URL, {
            transports: ['websocket'],
        });
        this.gameClient = new GameClient(this.$refs.canvas as HTMLCanvasElement);
        this.gameClientSocket = new GameClientSocket(this.socket, this.gameClient);

        window.addEventListener('resize', this.onWindowResize);

        window.addEventListener('keydown', this.onKeyboardEvent);
        window.addEventListener('keyup', this.onKeyboardEvent);
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

    /* background: rgba(0, 0, 0, 0.5); */
}
</style>
