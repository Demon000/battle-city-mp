import { Component } from '@/ecs/Component';

export interface DirtyBoundingBoxComponentData {}

export class DirtyBoundingBoxComponent
    extends Component<DirtyBoundingBoxComponent>
    implements DirtyBoundingBoxComponentData {
    static TAG = 'DBB';
}
