/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_SOCKET_BASE_URL: string;
    readonly VITE_APP_SPRITES_RELATIVE_URL: string;
    readonly VITE_APP_SOUNDS_RELATIVE_URL: string;
    readonly VITE_APP_FONTS_RELATIVE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
