import { EntityId } from './EntityId';

export interface RegistryIdGenerator {
    generate(): EntityId;
    reset(): void;
}
