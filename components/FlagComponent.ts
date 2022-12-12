import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export interface FlagComponentData {
    sourceId: EntityId;
}

export class FlagComponent extends Component
    implements FlagComponentData {
    static TAG = 'F';

    sourceId = 'invalid';
}
