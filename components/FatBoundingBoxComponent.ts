import { Component } from '@/ecs/Component';

export interface FatBoundingBoxComponentData {
    factor: number;
}

export class FatBoundingBoxComponent
    extends Component<FatBoundingBoxComponent>
    implements FatBoundingBoxComponentData {
    static TAG = 'FBB';

    factor = 0;
}
