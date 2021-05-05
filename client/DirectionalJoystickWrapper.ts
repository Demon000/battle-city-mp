import EventEmitter from 'eventemitter3';
import nipplejs, { EventData, JoystickManager, JoystickManagerOptions, JoystickOutputData } from 'nipplejs';

export interface DirectionalJoystickEvent {
    type: string;
    angle: string;
}

export default class DirectionalJoystickWrapper extends EventEmitter {
    private joystick: JoystickManager;
    private lastDirectionAngle?: string;

    constructor(options: JoystickManagerOptions) {
        super();

        this.joystick = nipplejs.create(options);
        this.joystick.on('move', this.onJoystickMoveEvent.bind(this));
        this.joystick.on('end', this.onJoystickEndEvent.bind(this));
    }

    private onJoystickMoveEvent(_event: EventData, data: JoystickOutputData): void {
        if (data.direction === undefined) {
            return;
        }

        if (data.direction.angle === this.lastDirectionAngle) {
            return;
        }

        if (this.lastDirectionAngle !== undefined) {
            this.emit('dirup', {
                type: 'dirup',
                angle: this.lastDirectionAngle,
            });
        } 

        this.lastDirectionAngle = data.direction.angle;
        if (this.lastDirectionAngle === undefined) {
            return;
        }

        this.emit('dirdown', {
            type: 'dirdown',
            angle: this.lastDirectionAngle,
        });
    }

    private onJoystickEndEvent(): void {
        this.emit('dirup', {
            type: 'dirup',
            angle: this.lastDirectionAngle,
        });
        this.lastDirectionAngle = undefined;
    }
}
