import { Direction } from '../physics/Direction';
import Action, { ActionOptions, ActionType } from './Action';

export enum ButtonType {
    UP,
    RIGHT,
    DOWN,
    LEFT,
    SHOOT,
}

export const BUTTON_TYPE_DIRECTION: Partial<Record<ButtonType, Direction>> = {
    [ButtonType.UP]: Direction.UP,
    [ButtonType.RIGHT]: Direction.RIGHT,
    [ButtonType.DOWN]: Direction.DOWN,
    [ButtonType.LEFT]: Direction.LEFT,
};

export const MOVE_BUTTON_TYPES = [
    ButtonType.UP,
    ButtonType.RIGHT,
    ButtonType.DOWN,
    ButtonType.LEFT,
];

export enum ButtonState {
    PRESSED,
    UNPRESSED,
}

export interface ButtonPressActionOptions extends ActionOptions {
    buttonType: ButtonType;
    buttonState: ButtonState;
}

export default class ButtonPressAction extends Action {
    buttonType: ButtonType;
    buttonState: ButtonState;

    constructor(options: ButtonPressActionOptions) {
        options.type = ActionType.BUTTON_PRESS;

        super(options);

        this.buttonType = options.buttonType;
        this.buttonState = options.buttonState;
    }
}
