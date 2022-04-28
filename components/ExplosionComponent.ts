import { Component } from '@/ecs/Component';
import { GameObjectType } from '@/object/GameObjectType';

export interface ExplosionComponentData {
    destroyedType: GameObjectType;
}

export class ExplosionComponent
    extends Component<ExplosionComponent>
    implements ExplosionComponentData {
    static TAG = 'EC';

    destroyedType = GameObjectType.NONE;
}
