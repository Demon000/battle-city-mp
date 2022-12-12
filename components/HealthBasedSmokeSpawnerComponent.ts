import { Component } from '@/ecs/Component';

export default interface HealthBasedSmokeSpawnerComponentData {
    map: Record<string, number>;
}

export class HealthBasedSmokeSpawnerComponent extends Component
    implements HealthBasedSmokeSpawnerComponentData {
    static TAG = 'HBSS';

    map: Record<string, number> = {};
}
