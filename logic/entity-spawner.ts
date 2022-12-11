import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { EntityOwnedComponent } from '@/components/EntityOwnedComponent';
import { EntitySpawnerActiveComponent } from '@/components/EntitySpawnerActiveComponent';
import { EntitySpawnerComponent } from '@/components/EntitySpawnerComponent';
import { HealthBasedSmokeSpawnerComponent } from '@/components/HealthBasedSmokeSpawnerComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { SmokeSpawnerComponent } from '@/components/SmokeSpawnerComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { DirectionComponent } from '@/components/DirectionComponent';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { ComponentClassType } from '@/ecs/Component';
import { PluginContext } from './plugin';

function handleEntityRegisteredDestroyed(
    registry: Registry,
    entity: Entity,
    registered: boolean,
): void {
    const entityOwnedComponent = entity
        .findComponent(EntityOwnedComponent);
    if (entityOwnedComponent === undefined) {
        return;
    }

    const ownerEntity = registry.findEntityById(entityOwnedComponent.id);
    if (ownerEntity === undefined) {
        return;
    }

    let clazz;
    switch (entity.type) {
        case EntityType.BULLET:
            clazz = BulletSpawnerComponent;
            break;
    }

    if (clazz === undefined) {
        return;
    }

    const spawnerComponent = ownerEntity.findComponent(clazz);
    if (spawnerComponent === undefined) {
        return;
    }

    if (registered) {
        spawnerComponent.ids[entity.id] = true;
        spawnerComponent.count++;
    } else {
        delete spawnerComponent.ids[entity.id];
        spawnerComponent.count--;
    }

    spawnerComponent.update({
        ids: spawnerComponent.ids,
        count: spawnerComponent.count,
    });
}

export function handleSpawnedEntityRegistered(this: PluginContext, entity: Entity): void {
    handleEntityRegisteredDestroyed(this.registry, entity, true);
}

export function handleSpawnedEntityDestroyed(this: PluginContext, entity: Entity): void {
    handleEntityRegisteredDestroyed(this.registry, entity, false);
}

export function setEntitySpawnerStatus<C>(
    entity: Entity,
    clazz: ComponentClassType<C>,
    status: boolean,
): void {
    let entitySpawnerActiveComponent =
        entity.findComponent(EntitySpawnerActiveComponent);
    if (entitySpawnerActiveComponent === undefined && !status) {
        return;
    }

    if (entitySpawnerActiveComponent === undefined) {
        entitySpawnerActiveComponent =
            entity.upsertComponent(EntitySpawnerActiveComponent) as 
                EntitySpawnerActiveComponent;
    }

    const activeSpawnerTags =
        entitySpawnerActiveComponent.tags;

    const tag = clazz.tag;

    if (status) {
        activeSpawnerTags[tag] = true;
    } else {
        delete activeSpawnerTags[tag];
    }

    if (Object.keys(activeSpawnerTags).length == 0) {
        entitySpawnerActiveComponent.remove();
    }
}

function canSpawnEntity(component: EntitySpawnerComponent): boolean {
    if (component.maxCount !== 0 && component.count >= component.maxCount) {
        return false;
    }

    if (Date.now() - component.lastSpawnTime < component.cooldown) {
        return false;
    }

    return true;
}

function createEntity(
    entityFactory: EntityFactory,
    spawner: EntitySpawnerComponent,
): Entity {
    const entity = spawner.entity;
    const centerPosition = entity.getComponent(CenterPositionComponent);

    const options = {
        silent: true,
    };

    const buildOptions = {
        type: spawner.type,
        subtypes: spawner.subtypes,
        components: spawner.components,
        ...options,
    };

    const spawnedEntity = entityFactory.buildFromOptions(buildOptions);

    const playerOwnedComponent = entity.findComponent(PlayerOwnedComponent);
    const spawnedPlayerOwnedComponent = spawnedEntity
        .findComponent(PlayerOwnedComponent);
    if (playerOwnedComponent !== undefined
        && spawnedPlayerOwnedComponent !== undefined) {
        spawnedPlayerOwnedComponent.update({
            playerId: playerOwnedComponent.playerId,
        }, options);
    }

    const spawnedEntityOwnedComponent = spawnedEntity
        .findComponent(EntityOwnedComponent);
    if (spawnedEntityOwnedComponent !== undefined) {
        spawnedEntityOwnedComponent.update({
            id: entity.id,
        }, options);
    }

    const directionComponent = entity.findComponent(DirectionComponent);
    const spawnedDirectionComponent = spawnedEntity
        .findComponent(DirectionComponent);
    if (directionComponent !== undefined
        && spawnedDirectionComponent !== undefined) {
        spawnedDirectionComponent.update({
            value: directionComponent.value,
        }, options);
    }

    const movementComponent = entity.findComponent(MovementComponent);
    const spawnedMovementComponent = spawnedEntity
        .findComponent(MovementComponent);
    if (spawnedMovementComponent) {
        if (movementComponent !== undefined
            && spawnedMovementComponent !== undefined
            && spawner.inheritSpeed) {
            spawnedMovementComponent.update({
                speed: spawnedMovementComponent.speed
                        + movementComponent.speed,
            }, options);
        }

        if (spawnedDirectionComponent) {
            spawnedMovementComponent.update({
                direction: spawnedDirectionComponent.value,
            }, options);
        }
    }

    const size = spawnedEntity.getComponent(SizeComponent);
    spawnedEntity.updateComponent(PositionComponent, {
        x: centerPosition.x - size.width / 2,
        y: centerPosition.y - size.height / 2,
    }, options);

    return spawnedEntity;
}

function spawnEntity(
    registry: Registry,
    spawner: EntitySpawnerComponent,
    spawnedEntity: Entity,
): void {
    registry.registerEntity(spawnedEntity);

    spawner.lastSpawnTime = Date.now();
}

export function updateHealthBasedSmokeSpawner(entity: Entity): void {
    const health = entity.getComponent(HealthComponent);
    const smokeSpawner = entity.findComponent(SmokeSpawnerComponent);
    const healthBasedSmokeSpawner = entity
        .findComponent(HealthBasedSmokeSpawnerComponent);

    if (smokeSpawner === undefined) {
        return;
    }

    if (healthBasedSmokeSpawner === undefined) {
        return;
    }

    if (health.max == health.value) {
        return;
    }

    const cooldown = healthBasedSmokeSpawner.map[health.value];
    if (cooldown === undefined) {
        return;
    }

    smokeSpawner.update({
        cooldown,
    });

    setEntitySpawnerStatus(entity, SmokeSpawnerComponent, true);
}

function processActiveEntitySpawner(
    registry: Registry,
    entityFactory: EntityFactory,
    component: EntitySpawnerActiveComponent,
) {
    const entity = component.entity;

    for (const tag of Object.keys(component.tags)) {
        const entitySpawnerComponent = entity.getComponent(tag) as
            EntitySpawnerComponent;
        if (!canSpawnEntity(entitySpawnerComponent)) {
            continue;
        }

        const spawnedEntity = createEntity(entityFactory,
            entitySpawnerComponent);
        spawnEntity(registry, entitySpawnerComponent, spawnedEntity);
    }
}

export function processActiveEntitySpawners(
    registry: Registry,
    entityFactory: EntityFactory,
): void {
    const components = registry
        .getComponents(EntitySpawnerActiveComponent);
    for (const component of components) {
        processActiveEntitySpawner(registry, entityFactory, component);
    }
}
