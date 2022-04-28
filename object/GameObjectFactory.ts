import { Registry } from '@/ecs/Registry';
import { EntityBlueprint } from '@/ecs/EntityBlueprint';
import { ComponentsInitialization } from '@/ecs/Component';
import { Entity } from '@/ecs/Entity';
import { EntityId } from '@/ecs/EntityId';

export interface GameObjectFactoryBuildOptions {
    id?: EntityId;
    type: string;
    subtypes?: string[];
    components?: ComponentsInitialization;
    silent?: boolean
}

export class GameObjectFactory {
    constructor(
        private registry: Registry,
        private entityBlueprint: EntityBlueprint,
    ) {}

    buildFromOptions(buildOptions: GameObjectFactoryBuildOptions): Entity {
        if (buildOptions.id === undefined) {
            buildOptions.id = this.registry.generateId();
        }

        let fullType = buildOptions.type;
        if (buildOptions.subtypes !== undefined
            && buildOptions.subtypes.length) {
            fullType += '-';
            fullType += buildOptions.subtypes.join('-');
        }

        const object = new Entity(this.registry, buildOptions.id,
            buildOptions.type, buildOptions.subtypes);
        this.entityBlueprint.addComponents(fullType, object, {
            silent: true,
        });

        const components = buildOptions.components;
        if (components !== undefined) {
            object.upsertComponents(components, {
                silent: true,
            });
        }

        if (!buildOptions.silent) {
            this.registry.registerEntity(object);
        }

        return object;
    }
}
