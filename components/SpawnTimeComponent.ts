import { Component, ComponentClassType } from '@/ecs/Component';
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
        clazz: ComponentClassType<SpawnTimeComponent>,
    ) {
        super(registry, clazz);

        this.value = Date.now();
    }
}
