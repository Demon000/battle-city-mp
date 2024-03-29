import EventEmitter from 'eventemitter3';

export enum ButtonNumber {
    ACTION_X = 2,
    DPAD_UP = 12,
    DPAD_DOWN = 13,
    DPAD_LEFT = 14,
    DPAD_RIGHT = 15,
}

const buttonNumbers = [
    ButtonNumber.ACTION_X,
    ButtonNumber.DPAD_UP,
    ButtonNumber.DPAD_DOWN,
    ButtonNumber.DPAD_LEFT,
    ButtonNumber.DPAD_RIGHT,
];

export interface GamepadWrapperEventData {
    buttonNumber: ButtonNumber;
    value: number;
}

export enum GamepadWrapperEvent {
    CONTROLLER_EVENT = 'controller-event',
}

export interface GamepadWrapperEvents {
    [GamepadWrapperEvent.CONTROLLER_EVENT]: (data: GamepadWrapperEventData) => void;
}

export class GamepadWrapper {
    emitter = new EventEmitter();
    gamepadIndex?: number;
    buttons: Record<string, number> = {};

    constructor() {
        window.addEventListener('gamepadconnected',
            (event) => {
                this.gamepadIndex = (event as GamepadEvent).gamepad.index;
            });
    }

    getGamepad(): Gamepad | undefined {
        if (this.gamepadIndex === undefined) {
            return undefined;
        }

        const gamepads =  navigator.getGamepads();
        const gamepad = gamepads[this.gamepadIndex];
        if (gamepad === null) {
            return undefined;
        }

        return gamepad;
    }

    processUpdates(): void {
        const gamepad = this.getGamepad();
        if (gamepad === undefined) {
            return;
        }

        for (const buttonNumber of buttonNumbers) {
            const oldValue = this.buttons[buttonNumber];
            const value = gamepad.buttons[buttonNumber].value;

            if (oldValue !== value) {
                this.buttons[buttonNumber] = value;
                this.emitter.emit(GamepadWrapperEvent.CONTROLLER_EVENT, {
                    buttonNumber,
                    value,
                });
            }
        }
    }
}
