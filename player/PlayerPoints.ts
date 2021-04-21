export enum PlayerPointsEvent {
    KILL = 'kill',
    DEATH = 'death',
}

export const PlayerPoints: Record<PlayerPointsEvent, number> = {
    [PlayerPointsEvent.KILL]: 2,
    [PlayerPointsEvent.DEATH]: -1,
};
