import { Component } from '@/ecs/Component';

export enum DirtyCollisionType {
    ADD,
    UPDATE,
    REMOVE,
}

export interface DirtyCollisionsComponentData {
    type: DirtyCollisionType;
}

export class DirtyCollisionsComponent
    extends Component<DirtyCollisionsComponent>
    implements DirtyCollisionsComponentData {
    static TAG = 'DC';

    type = DirtyCollisionType.ADD;
}
