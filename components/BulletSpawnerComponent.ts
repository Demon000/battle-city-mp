import { EntitySpawnerComponent, EntitySpawnerComponentData } from './EntitySpawnerComponent';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface BulletSpawnerComponentData extends EntitySpawnerComponentData {}

export class BulletSpawnerComponent extends EntitySpawnerComponent {
    static TAG = 'BS';

    type = 'bullet';
}

registerComponent(BulletSpawnerComponent,
    createAssert<Partial<BulletSpawnerComponentData>>());
