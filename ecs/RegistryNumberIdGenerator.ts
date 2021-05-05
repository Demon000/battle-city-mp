import RegistryIDGenerator from './RegistryIdGenerator';

export default class RegistryNumberIdGenerator extends RegistryIDGenerator {
    nextId = 0;

    generate(): number {
        return this.nextId++;
    }
}
