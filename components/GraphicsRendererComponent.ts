import { IDrawable } from '@/drawable/IDrawable';
import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface GraphicsRendererComponentData {}

export class GraphicsRendererComponent extends Component
    implements GraphicsRendererComponentData {
    static TAG = 'GR';

    drawables: IDrawable[] | null | undefined = null;
}

registerComponent(GraphicsRendererComponent,
	createAssert<Partial<GraphicsRendererComponentData>>());
