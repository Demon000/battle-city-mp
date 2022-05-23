import { Component, ComponentClassType } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
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
        entity?: Entity,
    ) {
        super(registry, clazz, entity);

        this.value = Date.now();
    }
}
