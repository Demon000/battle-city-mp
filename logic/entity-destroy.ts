import { AutomaticDestroyComponent } from '@/components/AutomaticDestroyComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { WorldEntityComponent } from '@/components/WorldEntityComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';

export function destroyAllWorldEntities(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(WorldEntityComponent)) {
        entity.destroy();
    }
}

export function processAutomaticDestroy(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(AutomaticDestroyComponent)) {
        const spawnTimeComponent = entity.findComponent(SpawnTimeComponent);
        if (spawnTimeComponent !== undefined) {
            const automaticDestroyTimeMs =
                entity.getComponent(AutomaticDestroyComponent).timeMs;
            const spawnTime = spawnTimeComponent.value;
            if (Date.now() - spawnTime < automaticDestroyTimeMs) {
                continue;
            }
        }

        entity.destroy();
    }
}

export function addAutomaticDestroy(entity: Entity): void {
    entity.upsertComponent(AutomaticDestroyComponent);
}
