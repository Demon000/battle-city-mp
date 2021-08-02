import { Component } from '@/ecs/Component';

export interface GraphicDependenciesComponentData {
    components: string[],
}

export class GraphicDependenciesComponent
    extends Component<GraphicDependenciesComponent>
    implements GraphicDependenciesComponentData {
    components = new Array<string>();
}
