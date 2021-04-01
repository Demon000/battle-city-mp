export enum ActionType {
    BUTTON_PRESS = 'button-press',
}

export interface ActionOptions {
    timestamp: number;
    type: ActionType;
}

export default class Action {
    timestamp: number;
    type: ActionType;

    constructor(options: ActionOptions) {
        this.timestamp = options.timestamp;
        this.type = options.type;
    }

    toOptions(): ActionOptions {
        return {
            type: this.type,
            timestamp: this.timestamp,
        };
    }
}
