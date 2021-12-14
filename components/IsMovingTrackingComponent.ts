import { Component } from '@/ecs/Component';

export interface IsMovingTrackingComponentData {}

export class IsMovingTrackingComponent
    extends Component<IsMovingTrackingComponent>
    implements IsMovingTrackingComponentData {
    static TAG = 'IMT';
}
