import Bimap from '../utils/Bimap';
import Player from './Player';

export default class PlayerRepository {
    private map = new Bimap<string, Player>();

    exists(id: string): boolean {
        return this.map.rightExists(id);
    }

    get(id: string): Player {
        return this.map.getRight(id);
    }

    getAll(): Player[] {
        return this.map.getAllRight();
    }

    add(id: string, player: Player): void {
        this.map.add(id, player);
    }

    remove(id: string): void {
        this.map.removeLeft(id);
    }
}
