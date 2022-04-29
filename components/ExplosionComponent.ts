import { Component } from '@/ecs/Component';
import { EntityType } from '@/entity/EntityType';

export interface ExplosionComponentData {
    destroyedType: EntityType;
}

export class ExplosionComponent
    extends Component<ExplosionComponent>
    implements ExplosionComponentData {
    static TAG = 'EC';

    destroyedType = EntityType.NONE;
}