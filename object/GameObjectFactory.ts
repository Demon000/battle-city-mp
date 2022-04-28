import { Registry } from '@/ecs/Registry';
import { EntityBlueprint } from '@/ecs/EntityBlueprint';
import { GameObject, GameObjectOptions } from './GameObject';
import { ComponentsInitialization } from '@/ecs/Component';

export interface GameObjectFactoryBuildOptions {
    type: string,
    subtypes?: string[],
    options?: GameObjectOptions,
    components?: ComponentsInitialization,
    silent?: boolean
}

export class GameObjectFactory {
    constructor(
        private registry: Registry,
        private entityBlueprint: EntityBlueprint,
    ) {}

    buildFromOptions(buildOptions: GameObjectFactoryBuildOptions): GameObject {
        if (buildOptions.options === undefined) {
            buildOptions.options = {};
        }
        const options = buildOptions.options;

        if (options.id === undefined) {
            options.id = this.registry.generateId();
        }

        if (options.type === undefined) {
            options.type = buildOptions.type;
        }

        if (options.subtypes === undefined) {
            options.subtypes = buildOptions.subtypes;
        }

        let fullType = options.type;
        if (buildOptions.subtypes !== undefined
            && buildOptions.subtypes.length) {
            fullType += '-';
            fullType += buildOptions.subtypes.join('-');
        }

        const object = new GameObject(options, this.registry);
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
