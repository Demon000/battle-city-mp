import { Component } from '@/ecs/Component';

export interface EntitySpawnerActiveComponentData {
    tags: Record<string, boolean>;
}

export class EntitySpawnerActiveComponent extends Component
    implements EntitySpawnerActiveComponentData {
    tags: Record<string, boolean> = {};
    static TAG = 'ESA';
}
