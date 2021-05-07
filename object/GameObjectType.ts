export enum GameShortObjectType {
    BRICK_WALL = 'B',
    BUSH = '$',
    STEEL_WALL = 'S',
    PLAYER_SPAWN = 'O',
    LEVEL_BORDER = '#',
    ICE = 'I',
    WATER = 'W',
    SAND = 'A',
    GRASS = 'G',
}

export enum GameObjectType {
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
    SAND = 'sand',
    GRASS = 'grass',
}

export function isGameShortObjectType(shortType: string): boolean {
    return Object.values(GameShortObjectType).includes(shortType as any);
}

export function isGameObjectType(type: string): boolean {
    return Object.values(GameObjectType).includes(type as any);
}
