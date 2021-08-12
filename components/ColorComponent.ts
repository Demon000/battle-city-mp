import { Color } from '@/drawable/Color';
import { Component } from '@/ecs/Component';

export interface ColorComponentData {
    value: Color;
}

export class ColorComponent
    extends Component<ColorComponent>
    implements ColorComponentData {
    value: Color = [255, 255, 255];
}
