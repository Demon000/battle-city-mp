import { BulletComponent } from '@/components/BulletComponent';
import { EntityOwnedComponent } from '@/components/EntityOwnedComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { PlayerOwnedComponent } from '@/components/PlayerOwnedComponent';
import { Entity } from '@/ecs/Entity';
import { EntityType } from '@/entity/EntityType';
import { PluginContext } from '@/logic/plugin';
import { BoundingBoxUtils } from '@/physics/bounding-box/BoundingBoxUtils';
import { PlayerSpawnStatus } from '@/player/Player';
import { SameTeamBulletHitMode } from '@/services/GameModeService';
import { BulletPower } from '@/subtypes/BulletPower';
import { ExplosionType } from '@/subtypes/ExplosionType';
import { getBrickWallDestroyBox } from './brick-wall';
import { markDestroyed } from './entity-destroy';
import { createExplosion } from './explosion';
import { decreaseTankHealth } from './tank';

export function onBulletHitLevelBorder(
    this: PluginContext,
    bullet: Entity,
    _staticEntity: Entity,
): void {
    const entityFactory = this.entityFactory;

    createExplosion(entityFactory, bullet,
        ExplosionType.SMALL, EntityType.NONE);
    markDestroyed(bullet);
}

export function onBulletHitSteelWall(
    this: PluginContext,
    bullet: Entity, 
    steelWall: Entity,
): void {
    markDestroyed(bullet);
    const bulletPower = bullet.getComponent(BulletComponent).power;
    if (bulletPower === BulletPower.HEAVY) {
        createExplosion(this.entityFactory, bullet,
            ExplosionType.SMALL);
        markDestroyed(steelWall);
    } else {
        createExplosion(this.entityFactory, bullet,
            ExplosionType.SMALL, EntityType.NONE);
    }
}

export function onBulletHitBrickWall(
    this: PluginContext,
    bullet: Entity,
    brickWall: Entity,
): void {
    const destroyBox = getBrickWallDestroyBox(brickWall, bullet);
    markDestroyed(bullet);

    const destroyedBullets = this.collisionService
        .findMultipleOverlappingWithType(destroyBox,
            EntityType.BRICK_WALL);
    for (const bullet of destroyedBullets) {
        markDestroyed(bullet);
    }

    const destroyBoxCenter = BoundingBoxUtils.center(destroyBox);
    createExplosion(this.entityFactory, destroyBoxCenter,
        ExplosionType.SMALL);
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
    const tankPlayer = this.playerService.findPlayer(tankOwnerPlayerId);
    const bulletPlayer = this.playerService.findPlayer(bulletOwnerPlayerId);
    const isSameTeamShot = tankPlayer?.teamId === bulletPlayer?.teamId;

    const gameModeProperties = this.gameModeService.getGameModeProperties();
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
        const playerId =
            tank.getComponent(PlayerOwnedComponent).playerId;
        createExplosion(this.entityFactory, tank,
            ExplosionType.BIG, EntityType.TANK);
        this.playerService.setPlayerRequestedSpawnStatus(playerId, PlayerSpawnStatus.DESPAWN);
        this.playerService.addPlayerDeath(playerId);
        if (bulletPlayer !== undefined) {
            this.playerService.addPlayerKill(bulletPlayer.id);
        }
    } else {
        createExplosion(this.entityFactory, bullet,
            ExplosionType.SMALL, EntityType.NONE);
    }

    if (destroyBullet || bulletDamage <= 0) {
        createExplosion(this.entityFactory, bullet,
            ExplosionType.SMALL);
        markDestroyed(bullet);
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
    markDestroyed(movingBullet);
    markDestroyed(staticBullet);
}
