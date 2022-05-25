import { Component, ComponentFlags } from '@/ecs/Component';

export interface DirtyPositionComponentData {}

export class DirtyPositionComponent
    extends Component<DirtyPositionComponent>
    implements DirtyPositionComponentData {
    static TAG = 'DP';
    static BASE_FLAGS = ComponentFlags.SHARED | ComponentFlags.LOCAL_ONLY;
}
