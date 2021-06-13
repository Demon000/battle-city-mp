import { EntityId } from './EntityId';

export abstract class RegistryIdGenerator {
    abstract generate(): EntityId;
}
