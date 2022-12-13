import { Component } from '@/ecs/Component';
import { Registry } from '@/ecs/Registry';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface SpawnTimeComponentData {
    readonly value: number;
}

export class SpawnTimeComponent extends Component
    implements SpawnTimeComponentData {
    static TAG = 'ST';

    value: number;

    constructor(
        registry: Registry,
    ) {
        super(registry);

        this.value = Date.now();
    }
}

registerComponent(SpawnTimeComponent,
	createAssert<Partial<SpawnTimeComponentData>>());
