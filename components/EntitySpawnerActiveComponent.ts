import { Component } from '@/ecs/Component';

export interface EntitySpawnerActiveComponentData {
    tags: Record<string, boolean>;
}

export class EntitySpawnerActiveComponent
    extends Component<EntitySpawnerActiveComponent>
    implements EntitySpawnerActiveComponentData {
    tags: Record<string, boolean> = {};
}
