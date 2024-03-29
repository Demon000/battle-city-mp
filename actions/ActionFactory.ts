import { ButtonNumber, GamepadWrapperEventData } from '@/client/GamepadWrapper';
import { assert } from '@/utils/assert';
import { Action, ActionOptions, ActionType } from './Action';
import { ButtonPressAction, ButtonPressActionOptions, ButtonState, ButtonType } from './ButtonPressAction';

export class ActionFactory {
    static buildFromOptions(options: ActionOptions): Action {
        if (options.type === ActionType.BUTTON_PRESS) {
            return new ButtonPressAction(options as ButtonPressActionOptions);
        } else {
            assert(false, 'Action options type is invalid');
        }
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
            assert(false, 'Invalid keyboard event type');
        }

        let buttonType;
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                buttonType = ButtonType.UP;
                break;
            case 'a':
            case 'arrowleft':
                buttonType = ButtonType.LEFT;
                break;
            case 's':
            case 'arrowdown':
                buttonType = ButtonType.DOWN;
                break;
            case 'd':
            case 'arrowright':
                buttonType = ButtonType.RIGHT;
                break;
            case 'q':
                buttonType = ButtonType.DROP_FLAG;
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
    }

    static buildFromJoystickEvent(type: string, angle: string): ButtonPressAction | undefined {
        let buttonState;
        switch (type) {
            case 'dirup':
                buttonState = ButtonState.UNPRESSED;
                break;
            case 'dirdown':
                buttonState = ButtonState.PRESSED;
                break;
            default:
                assert(false, `Invalid joystick event type '${type}'`);
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
                assert(false, `Invalid joystick button angle '${angle}'`);
        }

        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState,
            buttonType,
        });
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
                assert(false, `Invalid button event type '${type}'`);
        }

        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState,
            buttonType: ButtonType.SHOOT,
        });
    }

    static buildFromControllerEvent(event: GamepadWrapperEventData): ButtonPressAction | undefined {
        let buttonType;
        switch (event.buttonNumber) {
            case ButtonNumber.ACTION_X:
                buttonType = ButtonType.SHOOT;
                break;
            case ButtonNumber.DPAD_UP:
                buttonType = ButtonType.UP;
                break;
            case ButtonNumber.DPAD_DOWN:
                buttonType = ButtonType.DOWN;
                break;
            case ButtonNumber.DPAD_LEFT:
                buttonType = ButtonType.LEFT;
                break;
            case ButtonNumber.DPAD_RIGHT:
                buttonType = ButtonType.RIGHT;
                break;
        }
        assert(buttonType !== undefined);

        const buttonState = event.value ? ButtonState.PRESSED : ButtonState.UNPRESSED;
        return new ButtonPressAction({
            timestamp: Date.now(),
            buttonState,
            buttonType,
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
