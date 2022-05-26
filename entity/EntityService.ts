import { AutomaticDestroyComponent } from '@/components/AutomaticDestroyComponent';
import { DestroyedComponent } from '@/components/DestroyedComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { MovementMultipliersComponent } from '@/components/MovementMultipliersComponent';
import { SpawnComponent } from '@/components/SpawnComponent';
import { SpawnTimeComponent } from '@/components/SpawnTimeComponent';
import { TeamOwnedComponent } from '@/components/TeamOwnedComponent';
import { WorldEntityComponent } from '@/components/WorldEntityComponent';
import { ComponentFlags } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { EntityId } from '@/ecs/EntityId';
import { Registry } from '@/ecs/Registry';
import { DirectionComponent } from '@/components/DirectionComponent';
import { CenterPositionComponent } from '@/components/CenterPositionComponent';
import { DirtyPositionComponent } from '@/components/DirtyPositionComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { RelativePositionChildrenComponent } from '@/components/RelativePositionChildrenComponent';
import { RelativePositionComponent } from '@/components/RelativePositionComponent';
import { RequestedPositionComponent } from '@/components/RequestedPositionComponent';
import { RequestedDirectionComponent } from '@/components/RequestedDirectionComponent';
import { SizeComponent } from '@/components/SizeComponent';
import { assert } from '@/utils/assert';
import { Random } from '@/utils/Random';
import { Direction } from '../physics/Direction';
import { Point } from '../physics/point/Point';
import { PointUtils } from '../physics/point/PointUtils';
import { EntityType } from './EntityType';
import { EntityFactory } from './EntityFactory';
import { MovementConfigComponent } from '@/components/MovementConfigComponent';

export class EntityService {
    constructor(
        private entityFactory: EntityFactory,
        private registry: Registry,
    ) {}

    createSpawnEffect(position: Point): Entity {
        return this.entityFactory.buildFromOptions({
            type: EntityType.SPAWN_EFFECT,
            components: {
                PositionComponent: position,
            },
        });
    }

    markDestroyed(entity: Entity): void {
        entity.upsertComponent(DestroyedComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    setMovementDirection(entityId: EntityId, direction: Direction | null): void {
        const entity = this.registry.getEntityById(entityId);
        const movement = entity.findComponent(MovementComponent);

        if (direction === null && movement !== undefined
            && movement.speed === 0) {
            movement.remove();
        } else if (direction !== null) {
            entity.upsertComponent(MovementComponent, {
                direction,
            });
        }
    }

    processEntityDirection(entity: Entity): void {
        const movement = entity.getComponent(MovementComponent);
        const direction = entity.getComponent(DirectionComponent).value;
        if (movement.direction === null || direction === movement.direction) {
            return;
        }

        entity.upsertComponent(RequestedDirectionComponent, {
            value: movement.direction,
        }, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    getRandomSpawnPosition(teamId: string | null): Point {
        const entities = this.registry.getEntitiesWithComponent(SpawnComponent);
        const playerSpawnEntities = new Array<Entity>();

        for (const entity of entities) {
            const playerSpawnTeamId = entity
                .getComponent(TeamOwnedComponent).teamId;
            if (teamId === null || teamId === playerSpawnTeamId) {
                playerSpawnEntities.push(entity);
            }
        }

        const playerSpawnEntity = Random.getRandomArrayElement(playerSpawnEntities);
        assert(playerSpawnEntity !== undefined,
            'Failed to get random spawn entity');

        return playerSpawnEntity.getComponent(PositionComponent);
    }

    private processMovementSpeed(entity: Entity, delta: number): void {
        const movement = entity.getComponent(MovementComponent);
        const movementConfig = entity.findComponent(MovementConfigComponent);
        const multipliers = entity.findComponent(MovementMultipliersComponent);

        let accelerationFactor = movementConfig?.accelerationFactor ?? 0;
        let decelerationFactor = movementConfig?.decelerationFactor ?? 0;
        let maxSpeed = movementConfig?.maxSpeed ?? 0;
        if (multipliers !== undefined) {
            accelerationFactor *= multipliers.accelerationFactorMultiplier;
            decelerationFactor *= multipliers.decelerationFactorMultiplier;
            maxSpeed *= multipliers.maxSpeedMultiplier;
        }

        let speed = movement.speed;
        if (movement.direction === null || maxSpeed < speed) {
            speed -= maxSpeed * decelerationFactor * delta;
            speed = Math.max(0, speed);
        } else if (speed < maxSpeed) {
            speed += maxSpeed * accelerationFactor * delta;
            speed = Math.min(speed, maxSpeed);
        }

        if (speed === movement.speed) {
            return;
        }

        if (speed === 0 && movement.direction === null) {
            movement.remove();
        } else {
            movement.update({
                speed,
            });
        }
    }

    markRequestedPosition(entity: Entity, position: Point): void {
        if (!entity.hasComponent(PositionComponent)) {
            return;
        }

        entity.upsertComponent(RequestedPositionComponent, position, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    private processEntityMovement(entity: Entity, delta: number): void {
        this.processMovementSpeed(entity, delta);

        const movement = entity.getComponent(MovementComponent);
        const distance = movement.speed * delta;
        if (distance === 0) {
            return;
        }

        const positionComponent = entity.getComponent(PositionComponent);
        const position = PointUtils.clone(positionComponent);
        const direction = entity.getComponent(DirectionComponent).value;
        if (direction === Direction.UP) {
            position.y -= distance;
        } else if (direction === Direction.RIGHT) {
            position.x += distance;
        } else if (direction === Direction.DOWN) {
            position.y += distance;
        } else if (direction === Direction.LEFT) {
            position.x -= distance;
        }

        entity.upsertComponent(RequestedPositionComponent, position, {
            flags: ComponentFlags.LOCAL_ONLY,
        });
    }

    processDestroyed(): void {
        for (const entity of this.registry.getEntitiesWithComponent(DestroyedComponent)) {
            entity.destroy();
        }
    }

    markAllWorldEntitiesDestroyed(): void {
        for (const entity of this.registry.getEntitiesWithComponent(WorldEntityComponent)) {
            this.markDestroyed(entity);
        }
    }

    processAutomaticDestroy(): void {
        for (const entity of this.registry.getEntitiesWithComponent(AutomaticDestroyComponent)) {
            const automaticDestroyTimeMs =
                entity.getComponent(AutomaticDestroyComponent).timeMs;
            const spawnTime =
                entity.getComponent(SpawnTimeComponent).value;
            if (Date.now() - spawnTime > automaticDestroyTimeMs) {
                this.markDestroyed(entity);
            }
        }
    }

    updateCenterPosition(entity: Entity, silent = false): void {
        const centerPosition = entity.getComponent(CenterPositionComponent);
        const position = entity.getComponent(PositionComponent);
        const size = entity.getComponent(SizeComponent);

        const x = position.x + size.width / 2;
        const y = position.y + size.height / 2;
        if (x === centerPosition.x && y === centerPosition.y) {
            return;
        }

        centerPosition.update({
            x,
            y,
        }, {
            silent,
        });
    }

    markDirtyRelativePosition(entity: Entity): void {
        if (!entity.hasComponent(RelativePositionComponent)) {
            return;
        }

        entity.upsertComponent(DirtyPositionComponent, undefined, {
            flags: ComponentFlags.LOCAL_ONLY,
            silent: true,
        });
    }

    isAttachedRelativeEntity(entity: Entity): boolean {
        return entity.hasComponent(RelativePositionComponent);
    }

    attachRelativeEntity(parent: Entity, child: Entity): void {
        const relativePositionComponent = child
            .findComponent(RelativePositionComponent);
        if (relativePositionComponent !== undefined) {
            this.unattachRelativeEntity(child);
        }

        child.upsertComponent(RelativePositionComponent, {
            entityId: parent.id,
        });

        const relativePositionChildrenComponent = parent
            .getComponent(RelativePositionChildrenComponent);
        relativePositionChildrenComponent.ids[child.id] = true;
        relativePositionChildrenComponent.update({
            ids: relativePositionChildrenComponent.ids,
        });
    }

    unattachRelativeEntity(child: Entity): void {
        const relativePositionComponent = child
            .findComponent(RelativePositionComponent);
        if (relativePositionComponent === undefined) {
            return;
        }

        const parentId = relativePositionComponent.entityId;
        const parent = this.registry.getEntityById(parentId);

        const relativePositionChildrenComponent = parent
            .getComponent(RelativePositionChildrenComponent);
        delete relativePositionChildrenComponent.ids[child.id];
        relativePositionChildrenComponent.update({
            ids: relativePositionChildrenComponent.ids,
        });

        relativePositionComponent.remove();
    }

    unattachRelativeEntities(entity: Entity): void {
        const relativePositionChildrenComponent = entity
            .findComponent(RelativePositionChildrenComponent);
        if (relativePositionChildrenComponent === undefined) {
            return;
        }

        for (const childId of
            Object.keys(relativePositionChildrenComponent.ids)) {
            const child = this.registry.getEntityById(+childId);
            this.unattachRelativeEntity(child);
        }
    }

    setEntityPosition(entity: Entity, position: Point): void {
        entity.upsertComponent(PositionComponent, position);
    }

    markRelativeChildrenDirtyPosition(entity: Entity): void {
        const relativePositionChildrenComponent = entity
            .findComponent(RelativePositionChildrenComponent);
        if (relativePositionChildrenComponent === undefined) {
            return;
        }

        for (const childId of
            Object.keys(relativePositionChildrenComponent.ids)) {
            const child = this.registry.getEntityById(+childId);
            this.markDirtyRelativePosition(child);
        }
    }

    updateRelativePosition(entity: Entity, silent = false): void {
        const relativePositionComponent = entity
            .findComponent(RelativePositionComponent);
        if (relativePositionComponent === undefined) {
            return;
        }

        const parentEntity = this.registry
            .getEntityById(relativePositionComponent.entityId);
        const parentPosition = parentEntity.getComponent(PositionComponent);

        entity.updateComponent(PositionComponent, {
            x: parentPosition.x + relativePositionComponent.x,
            y: parentPosition.y + relativePositionComponent.y,
        }, {
            silent,
        });
    }

    processDirtyRelativePosition(): void {
        for (const component of this.registry
            .getComponents(DirtyPositionComponent)) {

            const entity = component.entity;
            this.updateRelativePosition(entity);

            component.remove({
                silent: true,
            });
        }
    }

    processMovement(delta: number): void {
        for (const entity of this.registry.getEntitiesWithComponent(MovementComponent)) {
            this.processEntityDirection(entity);
            this.processEntityMovement(entity, delta);
        }
    }
}
