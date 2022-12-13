import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface FatBoundingBoxComponentData {
    factor: number;
}

export class FatBoundingBoxComponent extends Component
    implements FatBoundingBoxComponentData {
    static TAG = 'FBB';

    factor = 0;
}

registerComponent(FatBoundingBoxComponent,
	createAssert<Partial<FatBoundingBoxComponentData>>());
