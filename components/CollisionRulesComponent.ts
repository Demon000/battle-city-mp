import { Component } from '@/ecs/Component';
import { CollisionRule } from '@/physics/collisions/CollisionRule';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface CollisionRulesComponentData {
    rules: Record<string, CollisionRule>;
}

export class CollisionRulesComponent extends Component
    implements CollisionRulesComponentData {
    static TAG = 'CR';

    rules: Record<string, CollisionRule> = {};
}

registerComponent(CollisionRulesComponent,
    createAssert<Partial<CollisionRulesComponentData>>());
