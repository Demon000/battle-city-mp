import { Component } from '@/ecs/Component';
import { Size } from './Size';

export interface SizeComponentData extends Size {}

export class SizeComponent
    extends Component<SizeComponent>
    implements SizeComponentData {
    width = 0;
    height =  0;
}
