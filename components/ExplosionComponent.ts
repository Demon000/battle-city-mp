import { Component } from '@/ecs/Component';
import { EntityType } from '@/entity/EntityType';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface ExplosionComponentData {
    destroyedType: EntityType;
}

export class ExplosionComponent extends Component
    implements ExplosionComponentData {
    static TAG = 'EC';

    destroyedType = EntityType.NONE;
}

registerComponent(ExplosionComponent,
	createAssert<Partial<ExplosionComponentData>>());
