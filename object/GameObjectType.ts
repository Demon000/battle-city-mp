export enum GameShortObjectType {
    BRICK_WALL = 'B',
    BUSH = '$',
    STEEL_WALL = 'S',
    PLAYER_SPAWN = 'O',
    LEVEL_BORDER = '#',
    ICE = 'I',
    WATER = 'W',
}

export enum GameObjectType {
    ANY = 'any',
    NONE = 'none',
    BRICK_WALL = 'brick-wall',
    STEEL_WALL = 'steel-wall',
    BUSH = 'bush',
    PLAYER_SPAWN = 'player-spawn',
    LEVEL_BORDER = 'level-border',
    TANK = 'tank',
    BULLET = 'bullet',
    EXPLOSION = 'explosion',
    ICE = 'ice',
    SMOKE = 'smoke',
    WATER = 'water',
}

export const SavableGameObjectTypes = [
    GameObjectType.BRICK_WALL,
    GameObjectType.STEEL_WALL,
    GameObjectType.BUSH,
    GameObjectType.LEVEL_BORDER,
    GameObjectType.PLAYER_SPAWN,
    GameObjectType.ICE,
    GameObjectType.WATER,
];
