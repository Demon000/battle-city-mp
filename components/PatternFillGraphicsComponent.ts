import { Component } from '@/ecs/Component';

export interface PatternFillGraphicsComponentData {}

export class PatternFillGraphicsComponent
    extends Component<PatternFillGraphicsComponent>
    implements PatternFillGraphicsComponentData {
    static TAG = 'PFG';
}
