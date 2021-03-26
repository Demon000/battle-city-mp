export enum GameEvent {
    OBJECT_CHANGED = 'object-changed',
    OBJECTS_REGISTERD = 'objects-registered',
    OBJECT_REGISTERED = 'object-registered',
    OBJECT_UNREGISTERED = 'object-unregisterd',

    PLAYER_ADDED = 'player-added',
    PLAYERS_ADDED = 'players-added',
    PLAYER_REMOVED = 'player-removed',
    PLAYER_CHANGED = 'player-changed',

    PLAYER_ACTION = 'player-action',
    PLAYER_REQUEST_TANK_SPAWN = 'player-request-tank-spawn',
    PLAYER_REQUEST_GAME_OBJECTS = 'player-request-game-objects',
    PLAYER_REQUEST_PLAYERS = 'player-request-players',

    PLAYER_OBJECTS_REGISTERD = 'player-objects-registered',
    PLAYER_PLAYERS_ADDED = 'player-players-added',
}
