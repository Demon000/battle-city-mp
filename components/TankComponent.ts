import { Component } from '@/ecs/Component';

export interface TankComponentData {}

export class TankComponent extends Component
    implements TankComponentData {
    static TAG = 'T';
}
