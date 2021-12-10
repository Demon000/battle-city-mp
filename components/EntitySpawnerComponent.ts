import { Component, ComponentsInitialization } from '@/ecs/Component';
import { EntityId } from '@/ecs/EntityId';

export interface EntitySpawnerComponentData {
    type: string;
    subtypes?: string[];
    components?: ComponentsInitialization;
    ids: Record<EntityId, boolean>;
    maxCount: number;
    cooldown: number;
    lastSpawnTime: number;
    inheritSpeed: boolean;
}

export class EntitySpawnerComponent
    extends Component<EntitySpawnerComponent>
    implements EntitySpawnerComponentData {
    type = 'invalid';
    subtypes: string[] = [];
    components: ComponentsInitialization = {};
    ids: Record<EntityId, boolean> = {};
    count = 0;
    maxCount = 0;
    cooldown = 0;
    lastSpawnTime = 0;
    inheritSpeed = false;
}
