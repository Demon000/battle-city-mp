import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface NameComponentData {
    value: string;
}

export class NameComponent extends Component
    implements NameComponentData {
    static TAG = 'N';

    value = '';
}

registerComponent(NameComponent,
    createAssert<Partial<NameComponentData>>());
