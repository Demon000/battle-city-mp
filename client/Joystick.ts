import { ButtonState, ButtonType } from '@/actions/ButtonPressAction';
import EventEmitter from 'eventemitter3';

export enum JoystickEvent {
    BUTTON_EVENT = 'button-event',
}

export interface JoystickEvents {
    [JoystickEvent.BUTTON_EVENT]: (
        button: ButtonType,
        state: ButtonState,
    ) => void;
}

export default class Joystick {
    private startEvent: null | Touch | MouseEvent = null;
    private lastButtonType: ButtonType | undefined;
    emitter = new EventEmitter<JoystickEvents>();

    constructor(element: HTMLElement) {
        element.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this), {
            passive: true,
        });
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        element.addEventListener('touchstart', this.onTouchStart.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this), {
            passive: true,
        });
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
        document.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    }

    onEventStart(event: MouseEvent | Touch): void {
        this.startEvent = event;
    }

    onEventMove(event: MouseEvent | Touch): void {
        if (!this.startEvent) {
            return;
        }

        const xDiff = event.clientX - this.startEvent.clientX;
        const yDiff = event.clientY - this.startEvent.clientY;
        const angle = Math.atan2(yDiff, xDiff);
        let degree = angle * 180 / Math.PI;
        if (degree < 0) {
            degree += 360;
        }

        let buttonType;
        if (degree >= 360 - 45 || degree <= 90 - 45) {
            buttonType = ButtonType.RIGHT;
        } else if (degree <= 180 - 45) {
            buttonType = ButtonType.DOWN;
        } else if (degree <= 270 - 45) {
            buttonType = ButtonType.LEFT;
        } else {
            buttonType = ButtonType.UP;
        }

        if (buttonType === this.lastButtonType) {
            return;
        }

        if (this.lastButtonType !== undefined) {
            this.emitter.emit(JoystickEvent.BUTTON_EVENT, this.lastButtonType, ButtonState.UNPRESSED);
        }

        this.emitter.emit(JoystickEvent.BUTTON_EVENT, buttonType, ButtonState.PRESSED);
        this.lastButtonType = buttonType;
    }

    onEventEnd(): void {
        this.startEvent = null;

        if (this.lastButtonType === undefined) {
            return;
        }

        this.emitter.emit(JoystickEvent.BUTTON_EVENT, this.lastButtonType, ButtonState.UNPRESSED);
        this.lastButtonType = undefined;
    }

    onMouseDown(event: MouseEvent): void {
        this.onEventStart(event);
        event.preventDefault();
    }

    onMouseMove(event: MouseEvent): void {
        this.onEventMove(event);
        event.preventDefault();
    }

    onMouseUp(event: MouseEvent): void {
        this.onEventEnd();
        event.preventDefault();
    }

    getChangedStartTouch(event: TouchEvent): Touch | undefined {
        if (!this.startEvent || !('identifier' in this.startEvent)) {
            return undefined;
        }

        for (const touch of event.changedTouches) {
            if (touch.identifier === this.startEvent.identifier) {
                return touch;
            }
        }

        return undefined;
    }

    onTouchStart(event: TouchEvent): void {
        this.onEventStart(event.changedTouches[0]);
        event.preventDefault();
    }

    onTouchMove(event: TouchEvent): void {
        const changedStartTouch = this.getChangedStartTouch(event);
        if (changedStartTouch === undefined) {
            return;
        }

        this.onEventMove(changedStartTouch);
        event.preventDefault();
    }

    onTouchEnd(event: TouchEvent): void {
        const changedStartTouch = this.getChangedStartTouch(event);
        if (changedStartTouch === undefined) {
            return;
        }

        this.onEventEnd();
        event.preventDefault();
    }
}
