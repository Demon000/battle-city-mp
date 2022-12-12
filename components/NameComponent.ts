import { Component } from '@/ecs/Component';

export interface NameComponentData {
    value: string;
}

export class NameComponent extends Component
    implements NameComponentData {
    static TAG = 'N';

    value = '';
}
