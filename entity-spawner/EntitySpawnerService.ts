import { BulletSpawnerComponent } from '@/components/BulletSpawnerComponent';
import { EntityOwnedComponent } from '@/components/EntityOwnedComponent';
import { EntitySpawnerActiveComponent } from '@/components/EntitySpawnerActiveComponent';
import { EntitySpawnerComponent } from '@/components/EntitySpawnerComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { ClazzOrTag } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { GameObjectFactory } from '@/object/GameObjectFactory';
import { GameObjectType } from '@/object/GameObjectType';
import { DirectionComponent } from '@/physics/DirectionComponent';
import { CenterPositionComponent } from '@/physics/point/CenterPositionComponent';
import { PositionComponent } from '@/physics/point/PositionComponent';
import { SizeComponent } from '@/physics/size/SizeComponent';

export class EntitySpawnerService {
    constructor(
        private gameObjectFactory: GameObjectFactory,
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
            .getEntityById(entityOwnedComponent.entityId);

        let clazz;
        switch (entity.type) {
            case GameObjectType.BULLET:
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

        const ids = {...spawnerComponent.ids};

        if (registered) {
            ids[entity.id] = true;
        } else {
            delete ids[entity.id];
        }

        spawnerComponent.update({
            ids,
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

        let tag;
        if (typeof clazzOrTag === 'string') {
            tag = clazzOrTag;
        } else {
            tag = clazzOrTag.tag;
        }

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
        const count = Object.keys(component.ids).length;
        if (count >= component.maxCount) {
            return false;
        }
 
        if (Date.now() - component.lastSpawnTime < component.cooldown) {
            return false;
        }
 
        return true;
    }

    private spawnEntity(spawner: EntitySpawnerComponent): void {
        const entity = spawner.entity;
        const playerOwnedComponent = entity.findComponent(PlayerOwnedComponent);
        const centerPosition = entity.getComponent(CenterPositionComponent);
        const speed = entity.getComponent(MovementComponent).speed;
        const direction = entity.getComponent(DirectionComponent);

        const options = {
            type: spawner.type,
            subtypes: spawner.subtypes,
            components: {
                ...spawner.components,
                DirectionComponent: direction,
                PlayerOwnedComponent: playerOwnedComponent,
                EntityOwnedComponent: {
                    entityId: entity.id,
                },
                MovementComponent: {
                    ...spawner.components.MovementComponent,
                    direction: direction.value,
                    speed: spawner.components.MovementComponent.speed + speed,
                },
            },
            silent: true,
        };

        const spawnedEntity = this.gameObjectFactory.buildFromOptions(options);

        const size = spawnedEntity.getComponent(SizeComponent);
        spawnedEntity.updateComponent(PositionComponent, {
            x: centerPosition.x - size.width / 2,
            y: centerPosition.y - size.height / 2,
        }, {
            silent: true,
        });

        this.registry.registerEntity(spawnedEntity);

        spawner.lastSpawnTime = Date.now();
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
