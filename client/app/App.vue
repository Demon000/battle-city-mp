<template>
    <div id="app-content">
        <canvas id="game-canvas"></canvas>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'App',
    async mounted() {
        console.log('mounted app');
    },
});
</script>

<style>
</style>
