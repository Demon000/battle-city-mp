import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface TimeConfigComponentData {
    roundTime: number;
    scoreboardWatchTime: number;
}

export class TimeConfigComponent extends Component
    implements TimeConfigComponentData {
    static TAG = 'TC';

    roundTime = 300;
    scoreboardWatchTime = 10;
}

registerComponent(TimeConfigComponent,
    createAssert<Partial<TimeConfigComponentData>>());
