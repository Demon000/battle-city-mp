import { ComponentClassType } from '@/ecs/Component';
import { BoundingBoxComponent, BoundingBoxComponentData } from '@/physics/bounding-box/BoundingBoxComponent';
import { PositionComponent, PositionComponentData } from '@/physics/point/PositionComponent';
import { SizeComponent, SizeComponentData } from '@/physics/size/SizeComponent';
import { AutomaticDestroyComponent, AutomaticDestroyComponentData } from '../components/AutomaticDestroyComponent';
import { assert } from '@/utils/assert';
import { assertEquals } from 'typescript-is';
import { DestroyedComponent, DestroyedComponentData } from '@/components/DestroyedComponent';
import { GraphicDependenciesComponent, GraphicDependenciesComponentData } from '@/components/GraphicDependenciesComponent';
import { IsMovingComponent, IsMovingComponentData } from '@/components/IsMovingComponent';
import { DirectionAxisSnappingComponent, DirectionAxisSnappingComponentData } from '@/components/DirectionAxisSnappingComponent';
import { SpawnTimeComponent, SpawnTimeComponentData } from '@/components/SpawnTimeComponent';
import { IsUnderBushComponent, IsUnderBushComponentData } from '@/components/IsUnderBushComponent';
import { CenterPositionComponent, CenterPositionComponentData } from '@/physics/point/CenterPositionComponent';
import { DirtyBoundingBoxComponent, DirtyBoundingBoxComponentData } from '@/physics/bounding-box/DirtyBoundingBox';
import { RequestedPositionComponent, RequestedPositionComponentData } from '@/physics/point/RequestedPositionComponent';
import { DirtyCenterPositionComponent, DirtyCenterPositionComponentData } from '@/physics/point/DirtyCenterPositionComponent';
import { DirectionComponent, DirectionComponentData } from '@/physics/DirectionComponent';
import { RequestedDirectionComponent, RequestedDirectionComponentData } from '@/physics/RequestedDirectionComponent';
import { TankComponent, TankComponentData } from '@/tank/TankComponent';
import { SpawnComponent, SpawnComponentData } from '@/components/SpawnComponent';
import { IsMovingTrackingComponent, IsMovingTrackingComponentData } from '@/components/IsMovingTrackingComponent';
import { PlayerOwnedComponent, PlayerOwnedComponentData } from '@/components/PlayerOwnedComponent';
import { EntityOwnedComponent, EntityOwnedComponentData } from '@/components/EntityOwnedComponent';
import { BulletComponent, BulletComponentData } from '@/bullet/BulletComponent';
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
import { FlagComponent, FlagComponentData } from '@/flag/FlagComponent';
import { IsUnderBushTrackingComponent, IsUnderBushTrackingComponentData } from '@/components/IsUnderBushTrackingComponent';
import { DirtyIsUnderBushComponent, DirtyIsUnderBushComponentData } from '@/components/DirtyIsUnderBushComponent';
import { DirtyGraphicsComponent, DirtyGraphicsComponentData } from '@/components/DirtyGraphicsComponent';
import { DirtyIsMovingComponent, DirtyIsMovingComponentData } from '@/components/DirtyIsMovingComponent';

export class ComponentRegistry {
    _lookupAndValidate(
        data: any,
        tag: string,
        clazz?: ComponentClassType<any>,
    ): ComponentClassType<any> {
        switch(tag) {
            case BoundingBoxComponent.tag:
                clazz = BoundingBoxComponent;
                assertEquals<Partial<BoundingBoxComponentData>>(data);
                break;
            case PositionComponent.tag:
                clazz = PositionComponent;
                assertEquals<Partial<PositionComponentData>>(data);
                break;
            case SizeComponent.tag:
                clazz = SizeComponent;
                assertEquals<Partial<SizeComponentData>>(data);
                break;
            case AutomaticDestroyComponent.tag:
                clazz = AutomaticDestroyComponent;
                assertEquals<Partial<AutomaticDestroyComponentData>>(data);
                break;
            case DestroyedComponent.tag:
                clazz = DestroyedComponent;
                assertEquals<Partial<DestroyedComponentData>>(data);
                break;
            case GraphicDependenciesComponent.tag:
                clazz = GraphicDependenciesComponent;
                assertEquals<Partial<GraphicDependenciesComponentData>>(data);
                break;
            case IsMovingComponent.tag:
                clazz = IsMovingComponent;
                assertEquals<Partial<IsMovingComponentData>>(data);
                break;
            case DirectionAxisSnappingComponent.tag:
                clazz = DirectionAxisSnappingComponent;
                assertEquals<Partial<DirectionAxisSnappingComponentData>>(data);
                break;
            case SpawnTimeComponent.tag:
                clazz = SpawnTimeComponent;
                assertEquals<Partial<SpawnTimeComponentData>>(data);
                break;
            case IsUnderBushComponent.tag:
                clazz = IsUnderBushComponent;
                assertEquals<Partial<IsUnderBushComponentData>>(data);
                break;
            case CenterPositionComponent.tag:
                clazz = CenterPositionComponent;
                assertEquals<Partial<CenterPositionComponentData>>(data);
                break;
            case DirtyBoundingBoxComponent.tag:
                clazz = DirtyBoundingBoxComponent;
                assertEquals<Partial<DirtyBoundingBoxComponentData>>(data);
                break;
            case RequestedPositionComponent.tag:
                clazz = RequestedPositionComponent;
                assertEquals<Partial<RequestedPositionComponentData>>(data);
                break;
            case DirtyCenterPositionComponent.tag:
                clazz = DirtyCenterPositionComponent;
                assertEquals<Partial<DirtyCenterPositionComponentData>>(data);
                break;
            case DirectionComponent.tag:
                clazz = DirectionComponent;
                assertEquals<Partial<DirectionComponentData>>(data);
                break;
            case RequestedDirectionComponent.tag:
                clazz = RequestedDirectionComponent;
                assertEquals<Partial<RequestedDirectionComponentData>>(data);
                break;
            case TankComponent.tag:
                clazz = TankComponent;
                assertEquals<Partial<TankComponentData>>(data);
                break;
            case SpawnComponent.tag:
                clazz = SpawnComponent;
                assertEquals<Partial<SpawnComponentData>>(data);
                break;
            case IsMovingTrackingComponent.tag:
                clazz = IsMovingTrackingComponent;
                assertEquals<Partial<IsMovingTrackingComponentData>>(data);
                break;
            case PlayerOwnedComponent.tag:
                clazz = PlayerOwnedComponent;
                assertEquals<Partial<PlayerOwnedComponentData>>(data);
                break;
            case EntityOwnedComponent.tag:
                clazz = EntityOwnedComponent;
                assertEquals<Partial<EntityOwnedComponentData>>(data);
                break;
            case BulletComponent.tag:
                clazz = BulletComponent;
                assertEquals<Partial<BulletComponentData>>(data);
                break;
            case ColorComponent.tag:
                clazz = ColorComponent;
                assertEquals<Partial<ColorComponentData>>(data);
                break;
            case WorldEntityComponent.tag:
                clazz = WorldEntityComponent;
                assertEquals<Partial<WorldEntityComponentData>>(data);
                break;
            case MovementComponent.tag:
                clazz = MovementComponent;
                assertEquals<Partial<MovementComponentData>>(data);
                break;
            case MovementMultipliersComponent.tag:
                clazz = MovementMultipliersComponent;
                assertEquals<Partial<MovementMultipliersComponentData>>(data);
                break;
            case HealthComponent.tag:
                clazz = HealthComponent;
                assertEquals<Partial<HealthComponentData>>(data);
                break;
            case EntitySpawnerComponent.tag:
                clazz = EntitySpawnerComponent;
                assertEquals<Partial<EntitySpawnerComponentData>>(data);
                break;
            case EntitySpawnerActiveComponent.tag:
                clazz = EntitySpawnerActiveComponent;
                assertEquals<Partial<EntitySpawnerActiveComponentData>>(data);
                break;
            case BulletSpawnerComponent.tag:
                clazz = BulletSpawnerComponent;
                assertEquals<Partial<BulletSpawnerComponentData>>(data);
                break;
            case SmokeSpawnerComponent.tag:
                clazz = SmokeSpawnerComponent;
                assertEquals<Partial<SmokeSpawnerComponentData>>(data);
                break;
            case HealthBasedSmokeSpawnerComponent.tag:
                clazz = HealthBasedSmokeSpawnerComponent;
                assertEquals<Partial<HealthBasedSmokeSpawnerComponentData>>(data);
                break;
            case TeamOwnedComponent.tag:
                clazz = TeamOwnedComponent;
                assertEquals<Partial<TeamOwnedComponentData>>(data);
                break;
            case FlagComponent.tag:
                clazz = FlagComponent;
                assertEquals<Partial<FlagComponentData>>(data);
                break;
            case IsUnderBushTrackingComponent.tag:
                clazz = IsUnderBushTrackingComponent;
                assertEquals<Partial<IsUnderBushTrackingComponentData>>(data);
                break;
            case DirtyIsUnderBushComponent.tag:
                clazz = DirtyIsUnderBushComponent;
                assertEquals<Partial<DirtyIsUnderBushComponentData>>(data);
                break;
            case DirtyGraphicsComponent.tag:
                clazz = DirtyGraphicsComponent;
                assertEquals<Partial<DirtyGraphicsComponentData>>(data);
                break;
            case DirtyIsMovingComponent.tag:
                clazz = DirtyIsMovingComponent;
                assertEquals<Partial<DirtyIsMovingComponentData>>(data);
                break;
            default:
                assert(false, `Invalid tag '${tag}'`);
        }

        return clazz;
    }

    lookupAndValidate(
        data: any,
        tag?: string,
        clazz?: ComponentClassType<any>,
    ): ComponentClassType<any> {
        assert(tag !== undefined || clazz !== undefined);

        if (tag === undefined && clazz !== undefined) {
            tag = clazz.tag;
        }

        if (clazz !== undefined && data === undefined) {
            return clazz;
        }

        assert(tag !== undefined);

        const message = `Object is not assignable to component '${tag}'`;
        try {
            return this._lookupAndValidate(data, tag, clazz);
        } catch (err) {
            console.error(message, data);
            throw err;
        }
    }
}
