import { EntityId } from './EntityId';

export default class Entity {
    id: EntityId;

    constructor(id: EntityId) {
        this.id = id;
    }
}
