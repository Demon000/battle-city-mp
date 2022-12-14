import { RoundTimeComponent, TimeComponent } from '@/components';
import { TimeConfigComponent } from '@/components/TimeConfigComponent';
import { Entity } from '@/ecs/Entity';
import { Registry } from '@/ecs/Registry';
import { EntityFactory } from '@/entity/EntityFactory';
import { EntityIds } from '@/entity/EntityIds';
import { EntityType } from '@/entity/EntityType';
import { cancelPlayersActions } from './player';
import { PluginContext } from './plugin';

export function createTime(
    entityFactory: EntityFactory,
): Entity {
    const entity = entityFactory.buildFromOptions({
        type: EntityType.TIME,
        id: EntityIds.TIME,
    });

    const timeConfigComponent = entity.getComponent(TimeConfigComponent);
    const timeComponent = entity.getComponent(TimeComponent);

    timeComponent.update({
        value: timeConfigComponent.roundTime,
    });

    return entity;
}

function getTime(registry: Registry): Entity {
    return registry.getEntityById(EntityIds.TIME);
}

export function getTimeValue(entity: Entity): number {
    const timeComponent = entity.findComponent(TimeComponent);
    if (timeComponent !== undefined) {
        return timeComponent.value;
    }

    const roundTimeComponent = entity.getComponent(RoundTimeComponent);
    return roundTimeComponent.value;
}

export function processTime(
    registry: Registry,
    deltaSeconds: number,
): void {
    const timeEntity = getTime(registry);
    const timeComponent = timeEntity.getComponent(TimeComponent);
    const roundTimeComponent = timeEntity.getComponent(RoundTimeComponent);

    let value = timeComponent.value - deltaSeconds;
    if (value < 0) {
        value = 0;
    }

    timeComponent.update({
        value,
    });

    const roundValue = Math.ceil(value);
    if (roundValue === roundTimeComponent.value) {
        return;
    }

    roundTimeComponent.update({
        value: roundValue,
    });
}

export function isRoundEnded(registry: Registry): boolean {
    const timeEntity = getTime(registry);

    return getTimeValue(timeEntity) === 0;
}

export function isScoreboardWatchTime(registry: Registry): boolean {
    const timeEntity = getTime(registry);
    const timeConfigComponent = timeEntity.getComponent(TimeConfigComponent);
    const value = getTimeValue(timeEntity);

    return value < timeConfigComponent.scoreboardWatchTime;
}

export function cancelPlayerActionsOnScoredboardWatchTime(
    this: PluginContext,
): void {
    if (!isScoreboardWatchTime(this.registry)) {
        return;
    }

    cancelPlayersActions(this.registry);
}
