import { Component } from '@/ecs/Component';

export interface NewEntityComponentData {}

export class NewEntityComponent
    extends Component<NewEntityComponent>
    implements NewEntityComponentData {
}
