import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';
import { CollidedWithComponent, CollidedWithComponentData } from './CollidedWithComponent';

export class TankCollideFlagComponent extends CollidedWithComponent {
    static TAG = 'TF';
}

registerComponent(TankCollideFlagComponent,
    createAssert<Partial<CollidedWithComponentData>>());
