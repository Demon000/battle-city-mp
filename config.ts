// eslint-disable-next-line
export const CLIENT_CONFIG_SOCKET_BASE_URL: string = process.env
    .VUE_APP_SOCKET_BASE_URL as string;
// eslint-disable-next-line
export const CLIENT_SPRITES_RELATIVE_URL: string = process.env
    .VUE_APP_SPRITES_RELATIVE_URL as string;
// eslint-disable-next-line
export const CLIENT_SOUNDS_RELATIVE_URL: string = process.env
    .VUE_APP_SOUNDS_RELATIVE_URL as string;
// eslint-disable-next-line
export const CLIENT_CONFIG_FPS: number = Number.parseInt(process.env
    .VUE_APP_CLIENT_FPS!);
// eslint-disable-next-line
export const CLIENT_CONFIG_VISIBLE_GAME_SIZE: number = Number.parseInt(process.env
    .VUE_APP_VISIBLE_GAME_SIZE!);
// eslint-disable-next-line
export const SERVER_CONFIG_TPS: number = Number.parseInt(process.env
    .SERVER_TPS!);
