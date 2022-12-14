import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface TeamComponentData {}

export class TeamComponent extends Component
    implements TeamComponentData {
    static TAG = 'TEA';
}

registerComponent(TeamComponent,
    createAssert<Partial<TeamComponentData>>());
