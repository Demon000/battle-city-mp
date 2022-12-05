import { AutomaticDestroyComponent } from '@/components/AutomaticDestroyComponent';
import { DestroyedComponent } from '@/components/DestroyedComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { WorldEntityComponent } from '@/components/WorldEntityComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';

export function markDestroyed(entity: Entity): void {
    entity.upsertComponent(DestroyedComponent, undefined, {
        flags: ComponentFlags.LOCAL_ONLY,
    });
}

export function processDestroyed(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(DestroyedComponent)) {
        entity.destroy();
    }
}

export function markAllWorldEntitiesDestroyed(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(WorldEntityComponent)) {
        markDestroyed(entity);
    }
}

export function processAutomaticDestroy(registry: Registry): void {
    for (const entity of registry.getEntitiesWithComponent(AutomaticDestroyComponent)) {
        const automaticDestroyTimeMs =
            entity.getComponent(AutomaticDestroyComponent).timeMs;
        const spawnTime =
            entity.getComponent(SpawnTimeComponent).value;
        if (Date.now() - spawnTime > automaticDestroyTimeMs) {
            markDestroyed(entity);
        }
    }
}
