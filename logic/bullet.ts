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

export function onBulletHitLevelBorder(
    this: PluginContext,
    bullet: Entity,
    _staticEntity: Entity,
): void {
    const entityFactory = this.entityFactory;

    createExplosion(entityFactory, bullet,
        ExplosionType.SMALL, EntityType.NONE);

    bullet.destroy();
}

export function onBulletHitSteelWall(
    this: PluginContext,
    bullet: Entity, 
    steelWall: Entity,
): void {
    const bulletPower = bullet.getComponent(BulletComponent).power;
    if (bulletPower === BulletPower.HEAVY) {
        createExplosion(this.entityFactory, bullet,
            ExplosionType.SMALL);
        steelWall.destroy();
    } else {
        createExplosion(this.entityFactory, bullet,
            ExplosionType.SMALL, EntityType.NONE);
    }
    bullet.destroy();
}

export function onBulletHitBrickWall(
    this: PluginContext,
    bullet: Entity,
    brickWall: Entity,
): void {
    const destroyBox = getBrickWallDestroyBox(brickWall, bullet);

    const destroyedBullets = this.collisionService
        .findMultipleOverlappingWithType(destroyBox,
            EntityType.BRICK_WALL);
    for (const destroyedBullet of destroyedBullets) {
        destroyedBullet.destroy();
    }

    const destroyBoxCenter = BoundingBoxUtils.center(destroyBox);
    createExplosion(this.entityFactory, destroyBoxCenter,
        ExplosionType.SMALL);

    bullet.destroy();
}

export function onBulletHitTank(
    this: PluginContext,
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
    const tankPlayer = this.registry.getEntityById(tankOwnerPlayerId);
    const bulletPlayer = this.registry.getEntityById(bulletOwnerPlayerId);
    const tankPlayerTeamId = getPlayerTeamId(tankPlayer);
    const bulletPlayerTeamId = getPlayerTeamId(bulletPlayer);
    const isSameTeamShot = tankPlayerTeamId === bulletPlayerTeamId;

    const gameModeProperties = getGameModeProperties(this.registry);
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
        createExplosion(this.entityFactory, tank,
            ExplosionType.BIG, EntityType.TANK);
        tank.destroy();
        addPlayerDeath(tankPlayer);
        addPlayerKill(bulletPlayer);
    } else {
        createExplosion(this.entityFactory, bullet,
            ExplosionType.SMALL, EntityType.NONE);
    }

    if (destroyBullet || bulletDamage <= 0) {
        createExplosion(this.entityFactory, bullet, ExplosionType.SMALL);
        bullet.destroy();
    }
}

export function onBulletHitBullet(
    this: PluginContext,
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

    createExplosion(this.entityFactory, movingBullet,
        ExplosionType.SMALL);

    movingBullet.destroy();
    staticBullet.destroy();
}
