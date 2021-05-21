import NewEntityComponent from '@/components/NewEntityComponent';
import Registry from '@/ecs/Registry';

export default class EntityService {
    constructor(
        private registry: Registry,
    ) {}

    removeNewEntityComponents(): void {
        for (const component of this.registry.getComponents(
            NewEntityComponent,
        )) {
            component.remove();
        }

    }
}
