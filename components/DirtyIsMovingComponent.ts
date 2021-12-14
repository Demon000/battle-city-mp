import { Component } from '@/ecs/Component';

export interface DirtyIsMovingComponentData {}

export class DirtyIsMovingComponent
    extends Component<DirtyIsMovingComponent>
    implements DirtyIsMovingComponentData {
    static TAG = 'DIM';
}
