import { Component } from '@/ecs/Component';

export interface EntitiesOwnerComponentData {
    ids: Record<string, boolean>;
}

export class EntitiesOwnerComponent
    extends Component<EntitiesOwnerComponent>
    implements EntitiesOwnerComponentData {
    static TAG = 'EOR';

    ids: Record<string, boolean> = {};
}
