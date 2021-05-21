import { Component } from '@/ecs/Component';

export interface NewEntityComponentData {}

export default class NewEntityComponent
    extends Component<NewEntityComponent>
    implements NewEntityComponentData {
}
