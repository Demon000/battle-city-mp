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
import { CONFIG_SOCKET_BASE_URL } from '../config';
import { Vue } from 'vue-class-component';

export default class App extends Vue {
    gameClientSocket?: GameClientSocket;

    async mounted(): Promise<void> {
        this.gameClientSocket = new GameClientSocket(CONFIG_SOCKET_BASE_URL);
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
