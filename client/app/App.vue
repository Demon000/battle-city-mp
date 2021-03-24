<template>
    <div id="app-content">
        <canvas
            id="game-canvas"
            ref="canvas"
        ></canvas>
    </div>
</template>

<script lang="ts">
import GameClientSocket from '@/game/GameClientSocket';
import { CLIENT_CONFIG_SOCKET_BASE_URL } from '../../config';
import { Vue } from 'vue-class-component';
import GameClient from '@/game/GameClient';
import { io, Socket } from 'socket.io-client';

export default class App extends Vue {
    socket?: Socket;
    gameClient?: GameClient;
    gameClientSocket?: GameClientSocket;

    mounted(): void {
        this.socket = io(CLIENT_CONFIG_SOCKET_BASE_URL);
        this.gameClient = new GameClient(this.$refs.canvas as HTMLCanvasElement);
        this.gameClientSocket = new GameClientSocket(this.socket, this.gameClient);
    }

    beforeUnmount(): void {
        this.socket?.disconnect();
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
</style>
