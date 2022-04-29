import { ClazzOrTag, ComponentClassType } from '@/ecs/Component';
import { BoundingBoxComponent, BoundingBoxComponentData } from '@/components/BoundingBoxComponent';
import { PositionComponent, PositionComponentData } from '@/components/PositionComponent';
import { SizeComponent, SizeComponentData } from '@/components/SizeComponent';
import { AutomaticDestroyComponent, AutomaticDestroyComponentData } from '../components/AutomaticDestroyComponent';
import { assert } from '@/utils/assert';
import { assertEquals } from 'typescript-is';
import { DestroyedComponent, DestroyedComponentData } from '@/components/DestroyedComponent';
import { GraphicDependenciesComponent, GraphicDependenciesComponentData } from '@/components/GraphicDependenciesComponent';
import { IsMovingComponent, IsMovingComponentData } from '@/components/IsMovingComponent';
import { DirectionAxisSnappingComponent, DirectionAxisSnappingComponentData } from '@/components/DirectionAxisSnappingComponent';
import { SpawnTimeComponent, SpawnTimeComponentData } from '@/components/SpawnTimeComponent';
import { IsUnderBushComponent, IsUnderBushComponentData } from '@/components/IsUnderBushComponent';
import { CenterPositionComponent, CenterPositionComponentData } from '@/components/CenterPositionComponent';
import { DirtyBoundingBoxComponent, DirtyBoundingBoxComponentData } from '@/components/DirtyBoundingBoxComponent';
import { RequestedPositionComponent, RequestedPositionComponentData } from '@/components/RequestedPositionComponent';
import { DirtyCenterPositionComponent, DirtyCenterPositionComponentData } from '@/components/DirtyCenterPositionComponent';
import { DirectionComponent, DirectionComponentData } from '@/components/DirectionComponent';
import { RequestedDirectionComponent, RequestedDirectionComponentData } from '@/components/RequestedDirectionComponent';
import { TankComponent, TankComponentData } from '@/components/TankComponent';
import { SpawnComponent, SpawnComponentData } from '@/components/SpawnComponent';
import { IsMovingTrackingComponent, IsMovingTrackingComponentData } from '@/components/IsMovingTrackingComponent';
import { PlayerOwnedComponent, PlayerOwnedComponentData } from '@/components/PlayerOwnedComponent';
import { EntityOwnedComponent, EntityOwnedComponentData } from '@/components/EntityOwnedComponent';
import { BulletComponent, BulletComponentData } from '@/components/BulletComponent';
import { ColorComponent, ColorComponentData } from '@/components/ColorComponent';
import { WorldEntityComponent, WorldEntityComponentData } from '@/components/WorldEntityComponent';
import { MovementComponent, MovementComponentData } from '@/components/MovementComponent';
import { MovementMultipliersComponent, MovementMultipliersComponentData } from '@/components/MovementMultipliersComponent';
import { HealthComponent, HealthComponentData } from '@/components/HealthComponent';
import { EntitySpawnerComponent, EntitySpawnerComponentData } from '@/components/EntitySpawnerComponent';
import { BulletSpawnerComponent, BulletSpawnerComponentData } from '@/components/BulletSpawnerComponent';
import { EntitySpawnerActiveComponent, EntitySpawnerActiveComponentData } from '@/components/EntitySpawnerActiveComponent';
import { SmokeSpawnerComponent, SmokeSpawnerComponentData } from '@/components/SmokeSpawnerComponent';
import HealthBasedSmokeSpawnerComponentData, { HealthBasedSmokeSpawnerComponent } from '@/components/HealthBasedSmokeSpawnerComponent';
import { TeamOwnedComponent, TeamOwnedComponentData } from '@/components/TeamOwnedComponent';
import { FlagComponent, FlagComponentData } from '@/components/FlagComponent';
import { IsUnderBushTrackingComponent, IsUnderBushTrackingComponentData } from '@/components/IsUnderBushTrackingComponent';
import { DirtyIsUnderBushComponent, DirtyIsUnderBushComponentData } from '@/components/DirtyIsUnderBushComponent';
import { DirtyGraphicsComponent, DirtyGraphicsComponentData } from '@/components/DirtyGraphicsComponent';
import { DirtyIsMovingComponent, DirtyIsMovingComponentData } from '@/components/DirtyIsMovingComponent';
import { RelativePositionChildrenComponent, RelativePositionChildrenComponentData } from '@/components/RelativePositionChildrenComponent';
import { RelativePositionComponent, RelativePositionComponentData } from '@/components/RelativePositionComponent';
import { DirtyPositionComponent, DirtyPositionComponentData } from '@/components/DirtyPositionComponent';
import { PickupIgnoreComponent, PickupIgnoreComponentData } from '@/components/PickupIgnoreComponent';
import { DirtyCollisionsComponent, DirtyCollisionsComponentData } from '@/components/DirtyCollisionsComponent';
import { DynamicSizeComponent, DynamicSizeComponentData } from '@/components/DynamicSizeComponent';
import { ExplosionComponent, ExplosionComponentData } from '@/components/ExplosionComponent';
import { GraphicsRendererComponent, GraphicsRendererComponentData } from '@/components/GraphicsRendererComponent';

export class ComponentRegistry {
    static _lookupAndValidate(
        data: any,
        tag: string,
    ): ComponentClassType<any> {
        switch(tag) {
            case BoundingBoxComponent.tag:
            case BoundingBoxComponent.name:
                assertEquals<Partial<BoundingBoxComponentData>>(data);
                return BoundingBoxComponent;
            case PositionComponent.tag:
            case PositionComponent.name:
                assertEquals<Partial<PositionComponentData>>(data);
                return PositionComponent;
            case SizeComponent.tag:
            case SizeComponent.name:
                assertEquals<Partial<SizeComponentData>>(data);
                return SizeComponent;
            case AutomaticDestroyComponent.tag:
            case AutomaticDestroyComponent.name:
                assertEquals<Partial<AutomaticDestroyComponentData>>(data);
                return AutomaticDestroyComponent;
            case DestroyedComponent.tag:
            case DestroyedComponent.name:
                assertEquals<Partial<DestroyedComponentData>>(data);
                return DestroyedComponent;
            case GraphicDependenciesComponent.tag:
            case GraphicDependenciesComponent.name:
                assertEquals<Partial<GraphicDependenciesComponentData>>(data);
                return GraphicDependenciesComponent;
            case IsMovingComponent.tag:
            case IsMovingComponent.name:
                assertEquals<Partial<IsMovingComponentData>>(data);
                return IsMovingComponent;
            case DirectionAxisSnappingComponent.tag:
            case DirectionAxisSnappingComponent.name:
                assertEquals<Partial<DirectionAxisSnappingComponentData>>(data);
                return DirectionAxisSnappingComponent;
            case SpawnTimeComponent.tag:
            case SpawnTimeComponent.name:
                assertEquals<Partial<SpawnTimeComponentData>>(data);
                return SpawnTimeComponent;
            case IsUnderBushComponent.tag:
            case IsUnderBushComponent.name:
                assertEquals<Partial<IsUnderBushComponentData>>(data);
                return IsUnderBushComponent;
            case CenterPositionComponent.tag:
            case CenterPositionComponent.name:
                assertEquals<Partial<CenterPositionComponentData>>(data);
                return CenterPositionComponent;
            case DirtyBoundingBoxComponent.tag:
            case DirtyBoundingBoxComponent.name:
                assertEquals<Partial<DirtyBoundingBoxComponentData>>(data);
                return DirtyBoundingBoxComponent;
            case RequestedPositionComponent.tag:
            case RequestedPositionComponent.name:
                assertEquals<Partial<RequestedPositionComponentData>>(data);
                return RequestedPositionComponent;
            case DirtyCenterPositionComponent.tag:
            case DirtyCenterPositionComponent.name:
                assertEquals<Partial<DirtyCenterPositionComponentData>>(data);
                return DirtyCenterPositionComponent;
            case DirectionComponent.tag:
            case DirectionComponent.name:
                assertEquals<Partial<DirectionComponentData>>(data);
                return DirectionComponent;
            case RequestedDirectionComponent.tag:
            case RequestedDirectionComponent.name:
                assertEquals<Partial<RequestedDirectionComponentData>>(data);
                return RequestedDirectionComponent;
            case TankComponent.tag:
            case TankComponent.name:
                assertEquals<Partial<TankComponentData>>(data);
                return TankComponent;
            case SpawnComponent.tag:
            case SpawnComponent.name:
                assertEquals<Partial<SpawnComponentData>>(data);
                return SpawnComponent;
            case IsMovingTrackingComponent.tag:
            case IsMovingTrackingComponent.name:
                assertEquals<Partial<IsMovingTrackingComponentData>>(data);
                return IsMovingTrackingComponent;
            case PlayerOwnedComponent.tag:
            case PlayerOwnedComponent.name:
                assertEquals<Partial<PlayerOwnedComponentData>>(data);
                return PlayerOwnedComponent;
            case EntityOwnedComponent.tag:
            case EntityOwnedComponent.name:
                assertEquals<Partial<EntityOwnedComponentData>>(data);
                return EntityOwnedComponent;
            case BulletComponent.tag:
            case BulletComponent.name:
                assertEquals<Partial<BulletComponentData>>(data);
                return BulletComponent;
            case ColorComponent.tag:
            case ColorComponent.name:
                assertEquals<Partial<ColorComponentData>>(data);
                return ColorComponent;
            case WorldEntityComponent.tag:
            case WorldEntityComponent.name:
                assertEquals<Partial<WorldEntityComponentData>>(data);
                return WorldEntityComponent;
            case MovementComponent.tag:
            case MovementComponent.name:
                assertEquals<Partial<MovementComponentData>>(data);
                return MovementComponent;
            case MovementMultipliersComponent.tag:
            case MovementMultipliersComponent.name:
                assertEquals<Partial<MovementMultipliersComponentData>>(data);
                return MovementMultipliersComponent;
            case HealthComponent.tag:
            case HealthComponent.name:
                assertEquals<Partial<HealthComponentData>>(data);
                return HealthComponent;
            case EntitySpawnerComponent.tag:
            case EntitySpawnerComponent.name:
                assertEquals<Partial<EntitySpawnerComponentData>>(data);
                return EntitySpawnerComponent;
            case EntitySpawnerActiveComponent.tag:
            case EntitySpawnerActiveComponent.name:
                assertEquals<Partial<EntitySpawnerActiveComponentData>>(data);
                return EntitySpawnerActiveComponent;
            case BulletSpawnerComponent.tag:
            case BulletSpawnerComponent.name:
                assertEquals<Partial<BulletSpawnerComponentData>>(data);
                return BulletSpawnerComponent;
            case SmokeSpawnerComponent.tag:
            case SmokeSpawnerComponent.name:
                assertEquals<Partial<SmokeSpawnerComponentData>>(data);
                return SmokeSpawnerComponent;
            case HealthBasedSmokeSpawnerComponent.tag:
            case HealthBasedSmokeSpawnerComponent.name:
                assertEquals<Partial<HealthBasedSmokeSpawnerComponentData>>(data);
                return HealthBasedSmokeSpawnerComponent;
            case TeamOwnedComponent.tag:
            case TeamOwnedComponent.name:
                assertEquals<Partial<TeamOwnedComponentData>>(data);
                return TeamOwnedComponent;
            case FlagComponent.tag:
            case FlagComponent.name:
                assertEquals<Partial<FlagComponentData>>(data);
                return FlagComponent;
            case IsUnderBushTrackingComponent.tag:
            case IsUnderBushTrackingComponent.name:
                assertEquals<Partial<IsUnderBushTrackingComponentData>>(data);
                return IsUnderBushTrackingComponent;
            case DirtyIsUnderBushComponent.tag:
            case DirtyIsUnderBushComponent.name:
                assertEquals<Partial<DirtyIsUnderBushComponentData>>(data);
                return DirtyIsUnderBushComponent;
            case DirtyGraphicsComponent.tag:
            case DirtyGraphicsComponent.name:
                assertEquals<Partial<DirtyGraphicsComponentData>>(data);
                return DirtyGraphicsComponent;
            case DirtyIsMovingComponent.tag:
            case DirtyIsMovingComponent.name:
                assertEquals<Partial<DirtyIsMovingComponentData>>(data);
                return DirtyIsMovingComponent;
            case RelativePositionChildrenComponent.tag:
            case RelativePositionChildrenComponent.name:
                assertEquals<Partial<RelativePositionChildrenComponentData>>(data);
                return RelativePositionChildrenComponent;
            case RelativePositionComponent.tag:
            case RelativePositionComponent.name:
                assertEquals<Partial<RelativePositionComponentData>>(data);
                return RelativePositionComponent;
            case DirtyPositionComponent.tag:
            case DirtyPositionComponent.name:
                assertEquals<Partial<DirtyPositionComponentData>>(data);
                return DirtyPositionComponent;
            case PickupIgnoreComponent.tag:
            case PickupIgnoreComponent.name:
                assertEquals<Partial<PickupIgnoreComponentData>>(data);
                return PickupIgnoreComponent;
            case DirtyCollisionsComponent.tag:
            case DirtyCollisionsComponent.name:
                assertEquals<Partial<DirtyCollisionsComponentData>>(data);
                return DirtyCollisionsComponent;
            case DynamicSizeComponent.tag:
            case DynamicSizeComponent.name:
                assertEquals<Partial<DynamicSizeComponentData>>(data);
                return DynamicSizeComponent;
            case ExplosionComponent.tag:
            case ExplosionComponent.name:
                assertEquals<Partial<ExplosionComponentData>>(data);
                return ExplosionComponent;
            case GraphicsRendererComponent.tag:
            case GraphicsRendererComponent.name:
                assertEquals<Partial<GraphicsRendererComponentData>>(data);
                return GraphicsRendererComponent;
            default:
                assert(false, `Invalid tag '${tag}'`);
        }
    }

    static lookupAndValidate(
        data: any,
        clazzOrTag: ClazzOrTag,
    ): ComponentClassType<any> {
        let clazz;
        let tag;
        if (typeof clazzOrTag === 'string') {
            tag = clazzOrTag;
        } else {
            clazz = clazzOrTag;
        }

        if (clazz !== undefined && data === undefined) {
            return clazz;
        }

        if (clazz !== undefined) {
            tag = clazz.tag;
        }

        assert(tag !== undefined);

        try {
            return this._lookupAndValidate(data, tag);
        } catch (err) {
            console.error(`Object is not assignable to component '${tag}'`,
                data);
            throw err;
        }
    }

    static lookup(clazzOrTag: ClazzOrTag): ComponentClassType<any> {
        let clazz;
        let tag;

        if (typeof clazzOrTag === 'string') {
            tag = clazzOrTag;
        } else {
            clazz = clazzOrTag;
        }

        if (clazz !== undefined) {
            return clazz;
        }

        assert(tag !== undefined);

        return this._lookupAndValidate({}, tag);
    }
}
