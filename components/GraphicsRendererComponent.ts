import { Component } from '@/ecs/Component';

export interface GraphicsRendererComponentData {
    renderer: any;
}

export class GraphicsRendererComponent
    extends Component<GraphicsRendererComponent>
    implements GraphicsRendererComponentData {
    static TAG = 'GR';

    renderer: any;
}
