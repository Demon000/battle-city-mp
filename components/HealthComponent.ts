import { Component } from '@/ecs/Component';

export interface HealthComponentData {
    max: number;
    value: number;
}

export class HealthComponent extends Component
    implements HealthComponentData {
    static TAG = 'H';

    value = 0;
    max = 0;
}
