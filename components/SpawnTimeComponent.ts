import { Component, ComponentClassType } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';

export interface SpawnTimeComponentData {
    readonly value: number;
}

export class SpawnTimeComponent
    extends Component<SpawnTimeComponent>
    implements SpawnTimeComponentData {

    value: number;

    constructor(
        registry: Registry,
        entity: Entity,
        clazz: ComponentClassType<SpawnTimeComponent>,
    ) {
        super(registry, entity, clazz);

        this.value = Date.now();
    }
}
