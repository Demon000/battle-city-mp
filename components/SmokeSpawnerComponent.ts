import { EntitySpawnerComponent, EntitySpawnerComponentData } from './EntitySpawnerComponent';

export interface SmokeSpawnerComponentData extends EntitySpawnerComponentData {}

export class SmokeSpawnerComponent extends EntitySpawnerComponent {
    static TAG = 'SS';

    type = 'smoke';
}
