export default class Bimap<L, R> {
    private leftToRightMap = new Map<L, R>();
    private rightToLeftMap = new Map<R, L>();

    findLeft(right: R): L | undefined {
        return this.rightToLeftMap.get(right);
    }

    findRight(left: L): R | undefined {
        return this.leftToRightMap.get(left);
    }

    getLeft(right: R): L {
        const left = this.findLeft(right);
        if (left === undefined) {
            throw new Error('Map does not contain the given right'); 
        }

        return left;
    }

    getRight(left: L): R {
        const right = this.findRight(left);
        if (right === undefined) {
            throw new Error('Map does not contain the given left'); 
        }

        return right;
    }

    leftExists(right: R): boolean {
        return !!this.findLeft(right);
    }

    rightExists(left: L): boolean {
        return !!this.findRight(left);
    }

    getAllLeft(): L[] {
        return Array.from(this.rightToLeftMap.values());
    }

    getAllRight(): R[] {
        return Array.from(this.leftToRightMap.values());
    }

    add(left: L, right: R): void {
        if (this.rightExists(left)) {
            throw new Error('Map already contains the given left');
        }

        if (this.leftExists(right)) {
            throw new Error('Map already contains the given right');
        }

        this.leftToRightMap.set(left, right);
        this.rightToLeftMap.set(right, left);
    }

    remove(left: L, right: R): void {
        this.leftToRightMap.delete(left);
        this.rightToLeftMap.delete(right);
    }

    removeLeft(left: L): void {
        const right = this.getRight(left);
        this.remove(left, right);
    }

    removeRight(right: R): void {
        const left = this.getLeft(right);
        this.remove(left, right);
    }
}
