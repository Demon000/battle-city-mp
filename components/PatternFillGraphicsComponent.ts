import { Component, ComponentFlags } from '@/ecs/Component';

export interface PatternFillGraphicsComponentData {}

export class PatternFillGraphicsComponent
    extends Component<PatternFillGraphicsComponent>
    implements PatternFillGraphicsComponentData {
    static TAG = 'PFG';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
