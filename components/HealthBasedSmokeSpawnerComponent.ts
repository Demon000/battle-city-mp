import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export default interface HealthBasedSmokeSpawnerComponentData {
    map: Record<string, number>;
}

export class HealthBasedSmokeSpawnerComponent extends Component
    implements HealthBasedSmokeSpawnerComponentData {
    static TAG = 'HBSS';

    map: Record<string, number> = {};
}

registerComponent(HealthBasedSmokeSpawnerComponent,
    createAssert<Partial<HealthBasedSmokeSpawnerComponentData>>());
