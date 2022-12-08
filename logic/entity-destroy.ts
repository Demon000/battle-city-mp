import { AutomaticDestroyComponent } from '@/components/AutomaticDestroyComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { WorldEntityComponent } from '@/components/WorldEntityComponent';
import { Registry } from '@/ecs/Registry';

export function destroyAllWorldEntities(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(WorldEntityComponent)) {
        entity.destroy();
    }
}

export function processAutomaticDestroy(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(AutomaticDestroyComponent)) {
        const automaticDestroyTimeMs =
            entity.getComponent(AutomaticDestroyComponent).timeMs;
        const spawnTime =
            entity.getComponent(SpawnTimeComponent).value;
        if (Date.now() - spawnTime > automaticDestroyTimeMs) {
            entity.destroy();
        }
    }
}
