import { Component } from '@/ecs/Component';
import { Registry } from '@/ecs/Registry';

export interface SpawnTimeComponentData {
    readonly value: number;
}

export class SpawnTimeComponent
    extends Component<SpawnTimeComponent>
    implements SpawnTimeComponentData {
    static TAG = 'ST';

    value: number;

    constructor(
        registry: Registry,
    ) {
        super(registry);

        this.value = Date.now();
    }
}
