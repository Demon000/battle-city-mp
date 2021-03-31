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

    static buildFromEvent(event: Event): Action | undefined {
        if (['keydown', 'keyup'].includes(event.type)) {
            const keyboardEvent = event as KeyboardEvent;
            let buttonState;
            if (keyboardEvent.type === 'keydown') {
                buttonState = ButtonState.PRESSED;
            } else if (keyboardEvent.type === 'keyup') {
                buttonState = ButtonState.UNPRESSED;
            } else {
                throw new Error('Invalid keyboard event type');
            }

            let buttonType;
            switch (keyboardEvent.key) {
                case 'W':
                case 'w':
                    buttonType = ButtonType.UP;
                    break;
                case 'A':
                case 'a':
                    buttonType = ButtonType.LEFT;
                    break;
                case 'S':
                case 's':
                    buttonType = ButtonType.DOWN;
                    break;
                case 'D':
                case 'd':
                    buttonType = ButtonType.RIGHT;
                    break;
                case ' ':
                    buttonType = ButtonType.SHOOT;
                    break;
                default:
                    return undefined;
            }

            return new ButtonPressAction({
                timestamp: event.timeStamp,
                buttonState,
                buttonType,
            });
        } else {
            throw new Error('Invalid event type');
        }
    }

    static buildFromJoystickEvent(type: string, angle: string): Action | undefined {
        let buttonState;
        switch (type) {
            case 'dirup':
                buttonState = ButtonState.UNPRESSED;
                break;
            case 'dirdown':
                buttonState = ButtonState.PRESSED;
                break;
            default:
                throw new Error('Invalid joystick event type');
        }

        let buttonType;
        switch (angle) {
            case 'up':
                buttonType = ButtonType.UP;
                break;
            case 'down':
                buttonType = ButtonType.DOWN;
                break;
            case 'right':
                buttonType = ButtonType.RIGHT;
                break;
            case 'left':
                buttonType = ButtonType.LEFT;
                break;
            default:
                throw new Error('Invalid joystick button angle');
        }

        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState,
            buttonType,
        });
    }

    static buildFromShootButtonTouchEvent(type: string): Action | undefined {
        let buttonState;
        switch (type) {
            case 'touchend':
                buttonState = ButtonState.UNPRESSED;
                break;
            case 'touchstart':
                buttonState = ButtonState.PRESSED;
                break;
            default:
                throw new Error('Invalid button event type');
        }

        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState,
            buttonType: ButtonType.SHOOT,
        });
    }
}
