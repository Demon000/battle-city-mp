import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface TankComponentData {}

export class TankComponent extends Component
    implements TankComponentData {
    static TAG = 'T';
}

registerComponent(TankComponent,
	createAssert<Partial<TankComponentData>>());
