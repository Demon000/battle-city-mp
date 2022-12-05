import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import typescript from '@rollup/plugin-typescript';
import ttsc from 'ttypescript';

export default defineConfig({
    root: 'client',
    plugins: [
        vue(),
        typescript({
            typescript: ttsc,
        }),
    ],
});
