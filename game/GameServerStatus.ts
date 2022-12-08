import { EntityBuildOptions } from '@/entity/EntityFactory';

export interface GameServerStatus {
    entitiesOptions: Iterable<EntityBuildOptions>;
    configsData: Record<string, any>;
}
