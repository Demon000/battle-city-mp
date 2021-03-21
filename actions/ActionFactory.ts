import Action, { ActionOptions, ActionType } from './Action';
import ButtonPressAction, { ButtonPressActionOptions } from './ButtonPressAction';

export default class ActionFactory {
    static buildFromOptions(options: ActionOptions): Action {
        if (options.type === ActionType.BUTTON_PRESS) {
            return new ButtonPressAction(options as ButtonPressActionOptions);
        } else {
            throw new Error('Action options type is invalid');
        }
    }
}
