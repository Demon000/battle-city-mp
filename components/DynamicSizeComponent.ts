import { Component } from '@/ecs/Component';

export interface DynamicSizeComponentData {}

export class DynamicSizeComponent
    extends Component<DynamicSizeComponent>
    implements DynamicSizeComponentData {
    static TAG = 'DS';
}
