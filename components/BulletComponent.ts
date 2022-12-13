import { BulletPower } from '@/subtypes/BulletPower';
import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface BulletComponentData {
    damage: number;
    power: BulletPower;
}

export class BulletComponent extends Component
    implements BulletComponentData {
    damage = 0;
    static TAG = 'BC';

    power = BulletPower.LIGHT;
}

registerComponent(BulletComponent,
	createAssert<Partial<BulletComponentData>>());
