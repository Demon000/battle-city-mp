export enum ActionType {
    ANY = 'any',
    BUTTON_PRESS = 'button-press',
}

export interface ActionOptions {
    timestamp: number;
    type?: ActionType;
}

export class Action {
    timestamp: number;
    type: ActionType;

    constructor(options: ActionOptions) {
        this.timestamp = options.timestamp;
        this.type = options.type ?? ActionType.ANY;
    }

    toOptions(): ActionOptions {
        return {
            type: this.type,
            timestamp: this.timestamp,
        };
    }
}
