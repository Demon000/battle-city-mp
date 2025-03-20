import { BulletComponent } from '@/components/BulletComponent';
import { EntityOwnedComponent } from '@/components/EntityOwnedComponent';
import { SameTeamBulletHitMode } from '@/components/GameModeComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { Entity } from '@/ecs/Entity';
import { EntityType } from '@/entity/EntityType';
import { PluginContext } from '@/logic/plugin';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { BulletPower } from '@/subtypes/BulletPower';
import { ExplosionType } from '@/subtypes/ExplosionType';
import { getBrickWallDestroyBox } from './brick-wall';
import { createExplosion } from './explosion';
import { getGameModeProperties } from './game-mode';
import { addPlayerDeath, addPlayerKill, getPlayerTeamId } from './player';
import { decreaseTankHealth } from './tank';
import { BulletHitEntityComponent } from '@/components/BulletHitEntityComponent';
import { addAutomaticDestroy } from './entity-destroy';

export function onBulletHitLevelBorder(
    context: PluginContext,
    bullet: Entity,
    _staticEntity: Entity,
): void {
    const entityFactory = context.entityFactory;

    createExplosion(entityFactory, bullet,
        ExplosionType.SMALL, EntityType.NONE);

    addAutomaticDestroy(bullet);
}

export function onBulletHitSteelWall(
    context: PluginContext,
    bullet: Entity, 
    steelWall: Entity,
): void {
    const bulletPower = bullet.getComponent(BulletComponent).power;
    if (bulletPower === BulletPower.HEAVY) {
        createExplosion(context.entityFactory, bullet,
            ExplosionType.SMALL);
        addAutomaticDestroy(steelWall);
    } else {
        createExplosion(context.entityFactory, bullet,
            ExplosionType.SMALL, EntityType.NONE);
    }
    addAutomaticDestroy(bullet);
}

export function onBulletHitBrickWall(
    context: PluginContext,
    bullet: Entity,
    brickWall: Entity,
): void {
    const destroyBox = getBrickWallDestroyBox(brickWall, bullet);

    const destroyedWalls = context.collisionService
        .findMultipleOverlappingWithType(destroyBox,
            EntityType.BRICK_WALL);
    for (const destroyedWall of destroyedWalls) {
        addAutomaticDestroy(destroyedWall);
    }

    const destroyBoxCenter = BoundingBoxUtils.center(destroyBox);
    createExplosion(context.entityFactory, destroyBoxCenter,
        ExplosionType.SMALL);

    addAutomaticDestroy(bullet);
}

export function onBulletHitTank(
    context: PluginContext,
    bullet: Entity,
    tank: Entity,
): void {
    const bulletOwnerEntityId =
        bullet.getComponent(EntityOwnedComponent).id;
    if (bulletOwnerEntityId === tank.id) {
        return;
    }

    const tankHealth = tank.getComponent(HealthComponent);
    const bulletOwnerPlayerId =
        bullet.getComponent(PlayerOwnedComponent).playerId;
    const tankOwnerPlayerId =
        tank.getComponent(PlayerOwnedComponent).playerId;
    const tankPlayer = context.registry.getEntityById(tankOwnerPlayerId);
    const bulletPlayer = context.registry.getEntityById(bulletOwnerPlayerId);
    const tankPlayerTeamId = getPlayerTeamId(tankPlayer);
    const bulletPlayerTeamId = getPlayerTeamId(bulletPlayer);
    const isSameTeamShot = tankPlayerTeamId === bulletPlayerTeamId;

    const gameModeProperties = getGameModeProperties(context.registry);
    let destroyBullet = false;
    let ignoreBulletDamage = false;

    if (isSameTeamShot
        && gameModeProperties.sameTeamBulletHitMode
            === SameTeamBulletHitMode.DESTROY) {
        destroyBullet = true;
        ignoreBulletDamage = true;
    } else if (isSameTeamShot
        && gameModeProperties.sameTeamBulletHitMode
            === SameTeamBulletHitMode.PASS) {
        ignoreBulletDamage = true;
    } else if (!isSameTeamShot ||
        gameModeProperties.sameTeamBulletHitMode
            === SameTeamBulletHitMode.ALLOW) {
        destroyBullet = true;
    }

    const bulletComponent = bullet.getComponent(BulletComponent);
    let bulletDamage = bulletComponent.damage;
    if (!ignoreBulletDamage) {
        const oldTankHealth = tankHealth.value;

        decreaseTankHealth(tank, bulletDamage);
        bulletDamage -= oldTankHealth;

        bulletComponent.update({
            damage: bulletDamage,
        });
    }

    if (tankHealth.value <= 0) {
        createExplosion(context.entityFactory, tank,
            ExplosionType.BIG, EntityType.TANK);
        addAutomaticDestroy(tank);
        addPlayerDeath(tankPlayer);
        addPlayerKill(bulletPlayer);
    } else {
        createExplosion(context.entityFactory, bullet,
            ExplosionType.SMALL, EntityType.NONE);
    }

    if (destroyBullet || bulletDamage <= 0) {
        createExplosion(context.entityFactory, bullet, ExplosionType.SMALL);
        addAutomaticDestroy(bullet);
    }
}

export function onBulletHitBullet(
    context: PluginContext,
    movingBullet: Entity,
    staticBullet: Entity,
): void {
    const movingBulletOwnerEntityId =
        staticBullet.getComponent(EntityOwnedComponent).id;
    const staticBulletOwnerEntityId =
        staticBullet.getComponent(EntityOwnedComponent).id;
    if (movingBulletOwnerEntityId === staticBulletOwnerEntityId) {
        return;
    }

    createExplosion(context.entityFactory, movingBullet,
        ExplosionType.SMALL);

    addAutomaticDestroy(movingBullet);
    addAutomaticDestroy(staticBullet);
}

export function onBulletHitEntity(
    this: PluginContext,
    component: BulletHitEntityComponent,
): void {
    const entity = component.entity;
    const collidedEntity = this.registry.getEntityById(component.entityId);

    switch (collidedEntity.type) {
        case EntityType.LEVEL_BORDER:
            onBulletHitLevelBorder(this, entity, collidedEntity);
            break;
        case EntityType.STEEL_WALL:
            onBulletHitSteelWall(this, entity, collidedEntity);
            break;
        case EntityType.BRICK_WALL:
            onBulletHitBrickWall(this, entity, collidedEntity);
            break;
        case EntityType.TANK:
            onBulletHitTank(this, entity, collidedEntity);
            break;
        case EntityType.BULLET:
            onBulletHitBullet(this, entity, collidedEntity);
            break;
    }
}
