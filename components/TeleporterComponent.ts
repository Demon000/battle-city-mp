import { Component } from '@/ecs/Component';
import { Point } from '@/physics/point/Point';

export interface TeleporterComponentData {
    target: Point;
}

export class TeleporterComponent
    extends Component<TeleporterComponent>
    implements TeleporterComponentData {
    static TAG = 'TE';

    target = {
        x: 0,
        y: 0,
    };
}
