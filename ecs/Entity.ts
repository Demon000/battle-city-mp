import { EntityId } from './EntityId';
import Registry from './Registry';

export default class Entity {
    id: EntityId;
    __registry!: Registry;

    constructor(id: EntityId) {
        this.id = id;
    }
}
