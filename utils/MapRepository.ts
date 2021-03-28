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
            throw new Error('Map does not contaian the given key');
        }

        return value;
    }

    getMultiple(ids: K[]): V[] {
        const objects = new Array<V>();
        for (const id of ids) {
            objects.push(this.get(id));
        }

        return objects;
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
