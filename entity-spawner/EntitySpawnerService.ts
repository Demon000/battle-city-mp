import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { EntityOwnedComponent } from '@/components/EntityOwnedComponent';
import { EntitySpawnerActiveComponent } from '@/components/EntitySpawnerActiveComponent';
import { EntitySpawnerComponent } from '@/components/EntitySpawnerComponent';
import { HealthBasedSmokeSpawnerComponent } from '@/components/HealthBasedSmokeSpawnerComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { SmokeSpawnerComponent } from '@/components/SmokeSpawnerComponent';
import { ClazzOrTag } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry, RegistryComponentEvent } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityType } from '@/entity/EntityType';
import { DirectionComponent } from '@/components/DirectionComponent';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { ComponentRegistry } from '@/ecs/ComponentRegistry';

export class EntitySpawnerService {
    constructor(
        private entityFactory: EntityFactory,
        private registry: Registry,
    ) {}

    private handleEntityRegisteredDestroyed(
        entity: Entity,
        registered: boolean,
    ): void {
        const entityOwnedComponent = entity
            .findComponent(EntityOwnedComponent);
        if (entityOwnedComponent === undefined) {
            return;
        }

        const ownerEntity = this.registry
            .findEntityById(entityOwnedComponent.id);
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

        const spawnerComponent = ownerEntity
            .findComponent(clazz);
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

        this.registry.emit(RegistryComponentEvent.COMPONENT_UPDATED,
            spawnerComponent, {
                ids: spawnerComponent.ids,
                count: spawnerComponent.count,
            });
    }

    handleEntityRegistered(entity: Entity): void {
        this.handleEntityRegisteredDestroyed(entity, true);
    }

    handleEntityDestroyed(entity: Entity): void {
        this.handleEntityRegisteredDestroyed(entity, false);
    }

    setEntitySpawnerStatus(
        entity: Entity,
        clazzOrTag: ClazzOrTag, 
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

        const tag = ComponentRegistry.lookup(clazzOrTag).tag;

        if (status) {
            activeSpawnerTags[tag] = true;
        } else {
            delete activeSpawnerTags[tag];
        }

        if (Object.keys(activeSpawnerTags).length == 0) {
            entitySpawnerActiveComponent.remove();
        }
    }

    private canSpawnEntity(component: EntitySpawnerComponent): boolean {
        if (component.maxCount !== 0 && component.count >= component.maxCount) {
            return false;
        }
 
        if (Date.now() - component.lastSpawnTime < component.cooldown) {
            return false;
        }
 
        return true;
    }

    private spawnEntity(spawner: EntitySpawnerComponent): void {
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

        const spawnedEntity = this.entityFactory.buildFromOptions(buildOptions);

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

        this.registry.registerEntity(spawnedEntity);

        spawner.lastSpawnTime = Date.now();
    }

    updateHealthBasedSmokeSpawner(entity: Entity): void {
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

        this.setEntitySpawnerStatus(entity, SmokeSpawnerComponent, true);
    }

    processActiveEntitySpawner(component: EntitySpawnerActiveComponent) {
        const entity = component.entity;
        for (const tag of Object.keys(component.tags)) {
            const entitySpawnerComponent = entity.getComponent(tag) as
                EntitySpawnerComponent;
            if (!this.canSpawnEntity(entitySpawnerComponent)) {
                continue;
            }

            this.spawnEntity(entitySpawnerComponent);
        }
    }

    processActiveEntitySpawners(): void {
        const components = this.registry
            .getComponents(EntitySpawnerActiveComponent);
        for (const component of components) {
            this.processActiveEntitySpawner(component);
        }
    }
}
