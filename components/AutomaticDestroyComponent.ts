import { Component } from '@/ecs/Component';

export interface AutomaticDestroyComponentData {
    timeMs: number;
}

export class AutomaticDestroyComponent
    extends Component<AutomaticDestroyComponent>
    implements AutomaticDestroyComponentData {
    timeMs = 0;
}
