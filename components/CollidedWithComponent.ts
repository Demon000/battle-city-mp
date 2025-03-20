import { Component } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';
import { CollisionRuleType } from '@/physics/collisions/CollisionRule';

export interface CollidedWithComponentData {
    entityId: EntityId;
    type: CollisionRuleType;
}

export abstract class CollidedWithComponent extends Component
    implements CollidedWithComponentData {

    entityId = 'invalid';
    type = CollisionRuleType.PREVENT_MOVEMENT;
}
