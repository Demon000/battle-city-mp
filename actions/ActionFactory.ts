import Action, { ActionOptions, ActionType } from './Action';
import ButtonPressAction, { ButtonPressActionOptions, ButtonState, ButtonType } from './ButtonPressAction';

export default class ActionFactory {
    static buildFromOptions(options: ActionOptions): Action {
        if (options.type === ActionType.BUTTON_PRESS) {
            return new ButtonPressAction(options as ButtonPressActionOptions);
        } else {
            throw new Error('Action options type is invalid');
        }
    }

    static buildFromButton(buttonType: ButtonType, buttonState: ButtonState): ButtonPressAction {
        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState,
            buttonType,
        });
    }

    static buildFromKeyboardEvent(event: KeyboardEvent): ButtonPressAction | undefined {
        if (!['keydown', 'keyup'].includes(event.type)) {
            return undefined;
        }

        let buttonState;
        if (event.type === 'keydown') {
            buttonState = ButtonState.PRESSED;
        } else if (event.type === 'keyup') {
            buttonState = ButtonState.UNPRESSED;
        } else {
            throw new Error('Invalid keyboard event type');
        }

        let buttonType;
        switch (event.key.toLowerCase()) {
            case 'w':
                buttonType = ButtonType.UP;
                break;
            case 'a':
                buttonType = ButtonType.LEFT;
                break;
            case 's':
                buttonType = ButtonType.DOWN;
                break;
            case 'd':
                buttonType = ButtonType.RIGHT;
                break;
            case ' ':
                buttonType = ButtonType.SHOOT;
                break;
            default:
                return undefined;
        }

        return this.buildFromButton(buttonType, buttonState);
    }

    static buildFromShootButtonTouchEvent(type: string): ButtonPressAction | undefined {
        let buttonState;
        switch (type) {
            case 'touchend':
                buttonState = ButtonState.UNPRESSED;
                break;
            case 'touchstart':
                buttonState = ButtonState.PRESSED;
                break;
            default:
                throw new Error(`Invalid button event type: ${type}`);
        }

        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState,
            buttonType: ButtonType.SHOOT,
        });
    }

    static buildAllUnpressEvent(): ButtonPressAction {
        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState: ButtonState.UNPRESSED,
            buttonType: ButtonType.ALL,
        });
    }
}
