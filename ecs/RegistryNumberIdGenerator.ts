import { RegistryIdGenerator } from './RegistryIdGenerator';

export class RegistryNumberIdGenerator extends RegistryIdGenerator {
    nextId = 0;

    generate(): string {
        return '' + this.nextId++;
    }
}
