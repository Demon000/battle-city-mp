import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';
import { CollidedWithComponent, CollidedWithComponentData } from './CollidedWithComponent';

export class BulletHitEntityComponent extends CollidedWithComponent {
    static TAG = 'BE';
}

registerComponent(BulletHitEntityComponent,
    createAssert<Partial<CollidedWithComponentData>>());
