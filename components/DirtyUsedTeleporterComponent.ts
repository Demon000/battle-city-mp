import { Component } from '@/ecs/Component';

export interface DirtyUsedTeleporterComponentData {}

export class DirtyUsedTeleporterComponent
    extends Component<DirtyUsedTeleporterComponent>
    implements DirtyUsedTeleporterComponentData {
    static TAG = 'DIOT';
}
