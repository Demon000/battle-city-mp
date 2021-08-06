Error.stackTraceLimit = Infinity;

import { createApp } from 'vue';

import App from './app/App.vue';
import './main.css';

const app = createApp(App);

app.mount('#app');
