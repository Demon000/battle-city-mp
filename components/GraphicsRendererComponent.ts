import { IDrawable } from '@/drawable/IDrawable';
import { Component } from '@/ecs/Component';

export interface GraphicsRendererComponentData {}

export class GraphicsRendererComponent extends Component
    implements GraphicsRendererComponentData {
    static TAG = 'GR';

    drawables: IDrawable[] | null | undefined = null;
}
