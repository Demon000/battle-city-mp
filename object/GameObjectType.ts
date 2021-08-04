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
    DIRT = 'dirt',
    FLAG = 'flag',
}

export function isGameObjectType(type: string): boolean {
    return Object.values(GameObjectType).includes(type as any);
}
