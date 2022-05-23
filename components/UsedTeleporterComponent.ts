import { Component } from '@/ecs/Component';

export interface UsedTeleporterComponentData {}

export class UsedTeleporterComponent
    extends Component<UsedTeleporterComponent>
    implements UsedTeleporterComponentData {
    static TAG = 'UT';
}
