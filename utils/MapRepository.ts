import LazyIterable from './LazyIterable';

export default class MapRepository<K, V> {
    private map = new Map<K, V>();

    exists(key: K): boolean {
        return this.map.has(key);
    }

    find(key: K): V | undefined {
        return this.map.get(key);
    }

    get(key: K): V {
        const value = this.map.get(key);
        if (value === undefined) {
            throw new Error('Map does not contain the given key');
        }

        return value;
    }

    getMultiple(ids: Iterable<K>): Iterable<V> {
        return LazyIterable.from(ids)
            .map(id => this.get(id));
    }

    getAll(): V[] {
        return Array.from(this.map.values());
    }

    add(key: K, value: V): void {
        this.map.set(key, value);
    }

    remove(key: K): void {
        this.map.delete(key);
    }

    clear(): void {
        this.map.clear();
    }
}
