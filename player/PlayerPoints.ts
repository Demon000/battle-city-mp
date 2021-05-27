export enum PlayerPointsEvent {
    KILL = 'kill',
    DEATH = 'death',
    RETURN_FLAG = 'return-flag',
    CAPTURE_FLAG = 'capture-flag',
}

export const PlayerPoints: Record<PlayerPointsEvent, number> = {
    [PlayerPointsEvent.KILL]: 2,
    [PlayerPointsEvent.DEATH]: -1,
    [PlayerPointsEvent.CAPTURE_FLAG]: 10,
    [PlayerPointsEvent.RETURN_FLAG]: 5,
};
