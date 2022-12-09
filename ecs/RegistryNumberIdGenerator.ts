import { RegistryIdGenerator } from './RegistryIdGenerator';

export class RegistryNumberIdGenerator implements RegistryIdGenerator {
    private nextId = 0;

    generate(): string {
        return '' + this.nextId++;
    }

    reset(): void {
        this.nextId = 0;
    }
}
