import { ButtonPressAction, ButtonType } from '@/actions/ButtonPressAction';
import { Component } from '@/ecs/Component';
import { registerComponent } from '@/ecs/ComponentLookupTable';
import { createAssert } from 'typia';

export interface PlayerInputComponentData {
    map: Map<ButtonType, ButtonPressAction>;
}

export class PlayerInputComponent extends Component
    implements PlayerInputComponentData {
    static TAG = 'PLI';

    map = new Map<ButtonType, ButtonPressAction>();
}

registerComponent(PlayerInputComponent,
    createAssert<Partial<PlayerInputComponentData>>());
