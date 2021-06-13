import EventEmitter from 'eventemitter3';
import nipplejs, { EventData, JoystickManager, JoystickManagerOptions, JoystickOutputData } from 'nipplejs';

export interface DirectionalJoystickEvent {
    type: string;
    angle: string;
}

export class DirectionalJoystickWrapper extends EventEmitter {
    private manager: JoystickManager;
    private lastDirectionAngle?: string;

    constructor(options: JoystickManagerOptions) {
        super();

        this.manager = nipplejs.create(options);
        this.manager.on('move', this.onJoystickMoveEvent.bind(this));
        this.manager.on('end', this.onJoystickEndEvent.bind(this));
    }

    private onJoystickMoveEvent(_event: EventData, data: JoystickOutputData): void {
        if (this.lastDirectionAngle !== undefined) {
            this.emit('dirup', {
                type: 'dirup',
                angle: this.lastDirectionAngle,
            });
        }

        const angle = data.direction?.angle;
        if (angle !== undefined) {
            this.emit('dirdown', {
                type: 'dirdown',
                angle,
            });
        }

        this.lastDirectionAngle = angle;
    }

    private onJoystickEndEvent(): void {
        if (this.lastDirectionAngle === undefined) {
            return;
        }

        this.emit('dirup', {
            type: 'dirup',
            angle: this.lastDirectionAngle,
        });
    }
}
