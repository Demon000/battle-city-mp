import { ClazzOrTag, ComponentClassType } from '@/ecs/Component';
import { BoundingBoxComponent, BoundingBoxComponentData } from '@/components/BoundingBoxComponent';
import { PositionComponent, PositionComponentData } from '@/components/PositionComponent';
import { SizeComponent, SizeComponentData } from '@/components/SizeComponent';
import { AutomaticDestroyComponent, AutomaticDestroyComponentData } from '../components/AutomaticDestroyComponent';
import { assert } from '@/utils/assert';
import { assert as assertEquals } from 'typescript-json';
import { DestroyedComponent, DestroyedComponentData } from '@/components/DestroyedComponent';
import { GraphicDependenciesComponent, GraphicDependenciesComponentData } from '@/components/GraphicDependenciesComponent';
import { IsMovingComponent, IsMovingComponentData } from '@/components/IsMovingComponent';
import { DirectionAxisSnappingComponent, DirectionAxisSnappingComponentData } from '@/components/DirectionAxisSnappingComponent';
import { SpawnTimeComponent, SpawnTimeComponentData } from '@/components/SpawnTimeComponent';
import { CenterPositionComponent, CenterPositionComponentData } from '@/components/CenterPositionComponent';
import { RequestedPositionComponent, RequestedPositionComponentData } from '@/components/RequestedPositionComponent';
import { DirectionComponent, DirectionComponentData } from '@/components/DirectionComponent';
import { RequestedDirectionComponent, RequestedDirectionComponentData } from '@/components/RequestedDirectionComponent';
import { TankComponent, TankComponentData } from '@/components/TankComponent';
import { SpawnComponent, SpawnComponentData } from '@/components/SpawnComponent';
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
import { DirtyGraphicsComponent, DirtyGraphicsComponentData } from '@/components/DirtyGraphicsComponent';
import { RelativePositionChildrenComponent, RelativePositionChildrenComponentData } from '@/components/RelativePositionChildrenComponent';
import { RelativePositionComponent, RelativePositionComponentData } from '@/components/RelativePositionComponent';
import { DirtyPositionComponent, DirtyPositionComponentData } from '@/components/DirtyPositionComponent';
import { PickupIgnoreComponent, PickupIgnoreComponentData } from '@/components/PickupIgnoreComponent';
import { DynamicSizeComponent, DynamicSizeComponentData } from '@/components/DynamicSizeComponent';
import { ExplosionComponent, ExplosionComponentData } from '@/components/ExplosionComponent';
import { TeleporterComponent, TeleporterComponentData } from '@/components/TeleporterComponent';
import { PatternFillGraphicsComponent, PatternFillGraphicsComponentData } from '@/components/PatternFillGraphicsComponent';
import { CollisionTrackingComponent, CollisionTrackingComponentData } from '@/components/CollisionTrackingComponent';
import { CollisionRulesComponent, CollisionRulesComponentData } from '@/components/CollisionRulesComponent';
import { DirtyCollisionsAddComponent, DirtyCollisionsAddComponentData } from '@/components/DirtyCollisionsAddComponent';
import { DirtyCollisionsUpdateComponent, DirtyCollisionsUpdateComponentData } from '@/components/DirtyCollisionsUpdateComponent';
import { DirtyCollisionsRemoveComponent, DirtyCollisionsRemoveComponentData } from '@/components/DirtyCollisionsRemoveComponent';
import { MovementConfigComponent, MovementConfigComponentData } from '@/components/MovementConfigComponent';

export class ComponentRegistry {
    protected lookupAndValidate(
        tag: string,
        data: any,
    ): ComponentClassType<any> | undefined {
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
            case CenterPositionComponent.tag:
            case CenterPositionComponent.name:
                assertEquals<Partial<CenterPositionComponentData>>(data);
                return CenterPositionComponent;
            case RequestedPositionComponent.tag:
            case RequestedPositionComponent.name:
                assertEquals<Partial<RequestedPositionComponentData>>(data);
                return RequestedPositionComponent;
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
            case DirtyGraphicsComponent.tag:
            case DirtyGraphicsComponent.name:
                assertEquals<Partial<DirtyGraphicsComponentData>>(data);
                return DirtyGraphicsComponent;
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
            case DynamicSizeComponent.tag:
            case DynamicSizeComponent.name:
                assertEquals<Partial<DynamicSizeComponentData>>(data);
                return DynamicSizeComponent;
            case ExplosionComponent.tag:
            case ExplosionComponent.name:
                assertEquals<Partial<ExplosionComponentData>>(data);
                return ExplosionComponent;
            case TeleporterComponent.tag:
            case TeleporterComponent.name:
                assertEquals<Partial<TeleporterComponentData>>(data);
                return TeleporterComponent;
            case PatternFillGraphicsComponent.tag:
            case PatternFillGraphicsComponent.name:
                assertEquals<Partial<PatternFillGraphicsComponentData>>(data);
                return PatternFillGraphicsComponent;
            case CollisionTrackingComponent.tag:
            case CollisionTrackingComponent.name:
                assertEquals<Partial<CollisionTrackingComponentData>>(data);
                return CollisionTrackingComponent;
            case CollisionRulesComponent.tag:
            case CollisionRulesComponent.name:
                assertEquals<Partial<CollisionRulesComponentData>>(data);
                return CollisionRulesComponent;
            case DirtyCollisionsAddComponent.tag:
            case DirtyCollisionsAddComponent.name:
                assertEquals<Partial<DirtyCollisionsAddComponentData>>(data);
                return DirtyCollisionsAddComponent;
            case DirtyCollisionsUpdateComponent.tag:
            case DirtyCollisionsUpdateComponent.name:
                assertEquals<Partial<DirtyCollisionsUpdateComponentData>>(data);
                return DirtyCollisionsUpdateComponent;
            case DirtyCollisionsRemoveComponent.tag:
            case DirtyCollisionsRemoveComponent.name:
                assertEquals<Partial<DirtyCollisionsRemoveComponentData>>(data);
                return DirtyCollisionsRemoveComponent;
            case MovementConfigComponent.tag:
            case MovementConfigComponent.name:
                assertEquals<Partial<MovementConfigComponentData>>(data);
                return MovementConfigComponent;
        }
    }

    lookup(clazzOrTag: ClazzOrTag, data?: any): ComponentClassType<any> {
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

        if (data === undefined) {
            data = {};
        }

        assert(tag !== undefined);

        try {
            const clazz = this.lookupAndValidate(tag, data);
            assert(clazz !== undefined, `Invalid tag '${tag}'`);
            return clazz;
        } catch (err) {
            console.error(`Object is not assignable to component '${tag}'`,
                data);
            throw err;
        }
    }
}
