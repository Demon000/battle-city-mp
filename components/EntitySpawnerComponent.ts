import { Component, ComponentsInitialization } from '@/ecs/Component';

export interface EntitySpawnerComponentData {
    type: string;
    subtypes?: string[];
    components?: ComponentsInitialization;
    ids: Record<string, boolean>;
    count: number;
    maxCount: number;
    cooldown: number;
    lastSpawnTime: number;
    inheritSpeed: boolean;
}

export class EntitySpawnerComponent
    extends Component<EntitySpawnerComponent>
    implements EntitySpawnerComponentData {
    static TAG = 'ES';

    type = 'invalid';
    subtypes: string[] = [];
    components: ComponentsInitialization = {};
    ids: Record<string, boolean> = {};
    count = 0;
    maxCount = 0;
    cooldown = 0;
    lastSpawnTime = 0;
    inheritSpeed = false;
}
