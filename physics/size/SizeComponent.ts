import { Component } from '@/ecs/Component';
import { Size } from './Size';

export interface SizeComponentData {
    value: Size;
}

export class SizeComponent
    extends Component<SizeComponent>
    implements SizeComponentData {
    value: Size = { width: 0, height: 0 };
}
