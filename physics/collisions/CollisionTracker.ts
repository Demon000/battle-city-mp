export class CollisionTracker {
    private byTypeMap = new Map<string, Array<number>>();

    clear(): void {
        for (const entries of this.byTypeMap.values()) {
            entries.length = 0;
        }
    }

    markTypeObject(type: string, objectId: number): void {
        let entries = this.byTypeMap.get(type);
        if (entries === undefined) {
            entries = new Array<number>();
            this.byTypeMap.set(type, entries);
        }

        entries.push(objectId);
    }

    isCollidingWithType(type: string): boolean {
        const entries = this.byTypeMap.get(type);

        if (entries === undefined) {
            return false;
        }

        return entries.length > 0;
    }
}
