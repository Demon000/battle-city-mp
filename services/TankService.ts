import { Entity } from '@/ecs/Entity';
import { EntityId } from '@/ecs/EntityId';

export class TankService {
    private ownPlayerTankId: EntityId | null = null;

    setOwnPlayerTank(tank: Entity | null): void {
        const tankId = tank === null ? null : tank.id;
        this.ownPlayerTankId = tankId;
    }

    getOwnPlayerTankId(): EntityId | null {
        return this.ownPlayerTankId;
    }
}
