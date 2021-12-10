import { Component } from '@/ecs/Component';

export default interface HealthBasedSmokeSpawnerComponentData {
    map: Record<string, number>;
}

export class HealthBasedSmokeSpawnerComponent
    extends Component<HealthBasedSmokeSpawnerComponent>
    implements HealthBasedSmokeSpawnerComponentData {
    map: Record<string, number> = {};
}
