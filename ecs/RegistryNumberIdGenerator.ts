import { RegistryIdGenerator } from './RegistryIdGenerator';

export class RegistryNumberIdGenerator extends RegistryIdGenerator {
    nextId = 0;

    generate(): number {
        return this.nextId++;
    }
}
