import { Component, ComponentClassType } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { EntityGraphicsRenderer } from '@/entity/EntityGraphicsRenderer';

export interface GraphicsRendererComponentData {
}

export class GraphicsRendererComponent
    extends Component<GraphicsRendererComponent>
    implements GraphicsRendererComponentData {
    static TAG = 'GR';

    renderer: EntityGraphicsRenderer;

    constructor(
        registry: Registry,
        entity: Entity,
        clazz: ComponentClassType<GraphicsRendererComponent>,
    ) {
        super(registry, entity, clazz);

        this.renderer = new EntityGraphicsRenderer(entity);
    }
}
