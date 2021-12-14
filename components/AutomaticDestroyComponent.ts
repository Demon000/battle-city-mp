import { Component } from '@/ecs/Component';

export interface AutomaticDestroyComponentData {
    timeMs: number;
}

export class AutomaticDestroyComponent
    extends Component<AutomaticDestroyComponent>
    implements AutomaticDestroyComponentData {
    static TAG = 'AD';

    timeMs = 0;
}
