import { TimeComponent } from '@/components/TimeComponent';
import { BoundingBoxComponent } from '@/components/BoundingBoxComponent';
import { HealthComponent } from '@/components/HealthComponent';
import { MovementComponent } from '@/components/MovementComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { RelativePositionComponent } from '@/components/RelativePositionComponent';
import { RegistryComponentEvent, RegistryEvent } from '@/ecs/Registry';
import { batchComponentChanged, batchEntityDestroyed, batchEntityRegistered } from '@/logic/batch-events';
import { initializeBoundingBox, markDirtyAddCollisions, markDirtyCollisionTracking, markDirtyRemoveCollisions, markDirtyUpdateCollisions, removeCollisions, updateBoundingBox } from '@/logic/collisions';
import { updateIsMoving } from '@/logic/entity-movement';
import { initializeRelativePosition, markRelativeChildrenDirtyPosition, unattachRelativeEntities, unattachRelativeEntity } from '@/logic/entity-relative-position';
import { handleSpawnedEntityDestroyed, handleSpawnedEntityRegistered, updateHealthBasedSmokeSpawner } from '@/logic/entity-spawner';
import { removePlayerFromTeam } from '@/logic/player';
import { onTankCollideFlagOrFlagBase, removeTankFromPlayer, setTankOnPlayer } from '@/logic/tank';
import { removeTeamPlayers } from '@/logic/team';
import { cancelPlayerActionsOnScoredboardWatchTime } from '@/logic/time';
import { EventHandler } from './EventHandler';
import { BulletHitEntityComponent } from '@/components/BulletHitEntityComponent';
import { onBulletHitEntity } from '@/logic/bullet';
import { TankCollideFlagComponent } from '@/components/TankCollideFlagComponent';
import { EntityCollideTeleporterComponent } from '@/components/EntityCollideTeleporterComponent';
import { onEntityCollideTeleporter } from '@/logic/entity-teleporter';

export const gameServerEventHandlers: EventHandler<any>[] = [
    {
        event: RegistryEvent.ENTITY_REGISTERED,
        fns: [
            batchEntityRegistered,
            setTankOnPlayer,
            handleSpawnedEntityRegistered,
        ],
    },
    {
        event: RegistryEvent.ENTITY_BEFORE_DESTROY,
        fns: [
            removeTankFromPlayer,
            removePlayerFromTeam,
            removeTeamPlayers,
            removeCollisions,
            handleSpawnedEntityDestroyed,
            unattachRelativeEntities,
            unattachRelativeEntity,
            batchEntityDestroyed,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_CHANGED,
        fns: [
            batchComponentChanged,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_INITIALIZED,
        toEntity: true,
        component: RelativePositionComponent,
        fns: [
            initializeRelativePosition,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_INITIALIZED,
        toEntity: true,
        component: BoundingBoxComponent,
        fns: [
            initializeBoundingBox,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_ADDED,
        toEntity: true,
        component: BoundingBoxComponent,
        fns: [
            markDirtyAddCollisions,
            markDirtyCollisionTracking,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_UPDATED,
        toEntity: true,
        component: BoundingBoxComponent,
        fns: [
            markDirtyUpdateCollisions,
            markDirtyCollisionTracking,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_BEFORE_REMOVE,
        toEntity: true,
        component: BoundingBoxComponent,
        fns: [
            markDirtyRemoveCollisions,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_ADDED,
        toEntity: true,
        component: MovementComponent,
        fns: [
            updateIsMoving,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_UPDATED,
        toEntity: true,
        component: MovementComponent,
        fns: [
            updateIsMoving,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_UPDATED,
        toEntity: true,
        component: HealthComponent,
        fns: [
            updateHealthBasedSmokeSpawner,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_UPDATED,
        toEntity: true,
        component: PositionComponent,
        fns: [
            updateBoundingBox,
            markRelativeChildrenDirtyPosition,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_CHANGED,
        toEntity: true,
        component: TimeComponent,
        fns: [
            cancelPlayerActionsOnScoredboardWatchTime,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_ADDED,
        component: BulletHitEntityComponent,
        fns: [
            onBulletHitEntity,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_ADDED,
        component: TankCollideFlagComponent,
        fns: [
            onTankCollideFlagOrFlagBase,
        ],
    },
    {
        event: RegistryComponentEvent.COMPONENT_ADDED,
        component: EntityCollideTeleporterComponent,
        fns: [
            onEntityCollideTeleporter,
        ],
    },
];
