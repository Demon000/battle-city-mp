import { Color } from '@/drawable/Color';
import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface ColorComponentData {
    value: Color;
}

export class ColorComponent extends Component
    implements ColorComponentData {
    static TAG = 'C';

    value: Color = [255, 255, 255];
}

registerComponent(ColorComponent,
    createAssert<Partial<ColorComponentData>>());
