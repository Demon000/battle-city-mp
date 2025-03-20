import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';
import { CollidedWithComponent, CollidedWithComponentData } from './CollidedWithComponent';

export class EntityCollideTeleporterComponent extends CollidedWithComponent {
    static TAG = 'ET';
}

registerComponent(EntityCollideTeleporterComponent,
    createAssert<Partial<CollidedWithComponentData>>());
