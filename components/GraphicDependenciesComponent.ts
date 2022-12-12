import { Component } from '@/ecs/Component';

export interface GraphicDependenciesComponentData {
    components: Record<string, any>,
}

export class GraphicDependenciesComponent extends Component
    implements GraphicDependenciesComponentData {
    static TAG = 'GD';

    components = {};
}
