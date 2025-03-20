import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';
import { CollidedWithComponent, CollidedWithComponentData } from './CollidedWithComponent';

export class IsInsideBushComponent extends CollidedWithComponent {
    static TAG = 'IB';
}

registerComponent(IsInsideBushComponent,
    createAssert<Partial<CollidedWithComponentData>>());
