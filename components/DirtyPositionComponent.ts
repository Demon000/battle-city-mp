import { Component } from '@/ecs/Component';

export interface DirtyPositionComponentData {}

export class DirtyPositionComponent
    extends Component<DirtyPositionComponent>
    implements DirtyPositionComponentData {
    static TAG = 'DP';
}
