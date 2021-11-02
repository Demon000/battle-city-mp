import { EntitySpawnerComponent, EntitySpawnerComponentData } from './EntitySpawnerComponent';

export interface BulletSpawnerComponentData extends EntitySpawnerComponentData {}

export class BulletSpawnerComponent extends EntitySpawnerComponent {
    type = 'bullet';
}
