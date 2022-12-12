import { Component } from '@/ecs/Component';

export interface EntitiesOwnerComponentData {
    ids: Record<string, boolean>;
}

export class EntitiesOwnerComponent extends Component
    implements EntitiesOwnerComponentData {
    static TAG = 'EOR';

    ids: Record<string, boolean> = {};
}
