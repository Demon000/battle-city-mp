import { BulletPower } from '@/subtypes/BulletPower';
import { Component } from '@/ecs/Component';

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
