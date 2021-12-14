import { Component } from '@/ecs/Component';
import { Size } from '@/physics/size/Size';

export interface SizeComponentData extends Size {}

export class SizeComponent
    extends Component<SizeComponent>
    implements SizeComponentData {
    static TAG = 'S';

    width = 0;
    height =  0;
}
