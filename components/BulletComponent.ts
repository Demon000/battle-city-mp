import { BulletPower } from '@/bullet/BulletPower';
import { Component } from '@/ecs/Component';

export interface BulletComponentData {
    damage: number;
    power: BulletPower;
}

export class BulletComponent
    extends Component<BulletComponent>
    implements BulletComponentData {
    damage = 0;
    tag = 'BC';

    power = BulletPower.LIGHT;
}
