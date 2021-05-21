import NewEntityComponent from '@/entity/NewEntityComponent';
import Entity from '@/ecs/Entity';
import Registry from '@/ecs/Registry';
import Point from '@/physics/point/Point';
import PositionComponent from '@/physics/point/PositionComponent';
import EntityBlueprint from './EntityBlueprint';
import { EntityType } from './EntityType';

export default class EntityFactory {
    constructor(
        private registry: Registry,
        private entityBlueprints: EntityBlueprint,
    ) {}

    buildEntity(): Entity {
        const entity = this.registry.createEntity([
            NewEntityComponent,
        ]);
        return entity;
    }

    private buildBaseWorldObject(position: Point): Entity {
        const entity = this.buildEntity();

        entity.addComponent(PositionComponent, {
            value: position,
        });

        return entity;
    }

    buildBrickWall(position: Point): Entity {
        const entity = this.buildBaseWorldObject(position);

        entity.addComponents([
            ...this.entityBlueprints.getComponents(EntityType.BRICK_WALL),
        ]);

        return entity;
    }

    buildWorldObject(type: EntityType, position: Point): Entity {
        switch (type) {
            case EntityType.BRICK_WALL:
                return this.buildBrickWall(position);
            default:
                throw new Error(`Unexpected world object entity type: ${type}`)
        }
    }
}
