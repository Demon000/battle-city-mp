# Battle City Multiplayer

## Setting up

1. Copy the `.env.example` file to `.env`.
2. Rename the `VUE_APP_SOCKET_BASE_URL`, `VUE_APP_SPRITES_RELATIVE_URL`, `VUE_APP_SOUNDS_RELATIVE_URL`, `VUE_APP_FONTS_RELATIVE_URL` variables to point to the location of your server.
3. Optionally, modify the `VUE_APP_VISIBLE_GAME_SIZE` to control how much of the game world to show to the player.
4. Optionally, modify the `SERVER_TPS` to control how many ticks per second does the server run at.
5. Start the server in development mode by running `npm run server-dev -- --host server_ip --port server_port`. The host IP and port number you specify here must match the ones at step 3.
6. Start the client in development mode by running `npm run client-dev -- --host client_ip --port client_port`.
7. Open the client in your browser.
