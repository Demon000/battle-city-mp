import { EntitySpawnerComponent, EntitySpawnerComponentData } from './EntitySpawnerComponent';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface SmokeSpawnerComponentData extends EntitySpawnerComponentData {}

export class SmokeSpawnerComponent extends EntitySpawnerComponent {
    static TAG = 'SS';

    type = 'smoke';
}

registerComponent(SmokeSpawnerComponent,
    createAssert<Partial<SmokeSpawnerComponentData>>());
