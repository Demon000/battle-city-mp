import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface GraphicDependenciesComponentData {
    components: Record<string, any>,
}

export class GraphicDependenciesComponent extends Component
    implements GraphicDependenciesComponentData {
    static TAG = 'GD';

    components = {};
}

registerComponent(GraphicDependenciesComponent,
	createAssert<Partial<GraphicDependenciesComponentData>>());
