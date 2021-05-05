import { EntityId } from './EntityId';

export default abstract class RegistryIDGenerator {
    abstract generate(): EntityId;
}
