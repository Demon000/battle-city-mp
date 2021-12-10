import { Component, ComponentClassType } from '@/ecs/Component';
import { BoundingBoxComponent, BoundingBoxComponentData } from '@/physics/bounding-box/BoundingBoxComponent';
import { PositionComponent, PositionComponentData } from '@/physics/point/PositionComponent';
import { SizeComponent, SizeComponentData } from '@/physics/size/SizeComponent';
import { AutomaticDestroyComponent, AutomaticDestroyComponentData } from '../components/AutomaticDestroyComponent';
import { assert } from '@/utils/assert';
import { is } from 'typescript-is';
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

export interface ProcessResults {
    clazz: ComponentClassType<any>;
    tag: string;
}

export class ComponentRegistry {
    private validate<T>(clazz: ComponentClassType<any>, data?: any) {
        if (data === undefined) {
            return;
        }

        assert(is<Partial<T>>(data),
            `Object is not assignable to component '${clazz.name}'`, data);
    }

    private process(tag?: string, clazz?: ComponentClassType<any>, data?: any): ProcessResults {
        assert(tag !== undefined || clazz !== undefined);

        if (tag === undefined && clazz !== undefined) {
            tag = clazz.tag;
        }

        switch(tag) {
            case BoundingBoxComponent.tag:
                clazz = BoundingBoxComponent;
                this.validate<BoundingBoxComponentData>(BoundingBoxComponent, data);
                break;
            case PositionComponent.tag:
                clazz = PositionComponent;
                this.validate<PositionComponentData>(PositionComponent, data);
                break;
            case SizeComponent.tag:
                clazz = SizeComponent;
                this.validate<SizeComponentData>(SizeComponent, data);
                break;
            case AutomaticDestroyComponent.tag:
                clazz = AutomaticDestroyComponent;
                this.validate<AutomaticDestroyComponentData>(AutomaticDestroyComponent, data);
                break;
            case DestroyedComponent.tag:
                clazz = DestroyedComponent;
                this.validate<DestroyedComponentData>(DestroyedComponent, data);
                break;
            case GraphicDependenciesComponent.tag:
                clazz = GraphicDependenciesComponent;
                this.validate<GraphicDependenciesComponentData>(GraphicDependenciesComponent, data);
                break;
            case IsMovingComponent.tag:
                clazz = IsMovingComponent;
                this.validate<IsMovingComponentData>(IsMovingComponent, data);
                break;
            case DirectionAxisSnappingComponent.tag:
                clazz = DirectionAxisSnappingComponent;
                this.validate<DirectionAxisSnappingComponentData>(DirectionAxisSnappingComponent, data);
                break;
            case SpawnTimeComponent.tag:
                clazz = SpawnTimeComponent;
                this.validate<SpawnTimeComponentData>(SpawnTimeComponent, data);
                break;
            case IsUnderBushComponent.tag:
                clazz = IsUnderBushComponent;
                this.validate<IsUnderBushComponentData>(IsUnderBushComponent, data);
                break;
            case CenterPositionComponent.tag:
                clazz = CenterPositionComponent;
                this.validate<CenterPositionComponentData>(CenterPositionComponent, data);
                break;
            case DirtyBoundingBoxComponent.tag:
                clazz = DirtyBoundingBoxComponent;
                this.validate<DirtyBoundingBoxComponentData>(DirtyBoundingBoxComponent, data);
                break;
            case RequestedPositionComponent.tag:
                clazz = RequestedPositionComponent;
                this.validate<RequestedPositionComponentData>(RequestedPositionComponent, data);
                break;
            case DirtyCenterPositionComponent.tag:
                clazz = DirtyCenterPositionComponent;
                this.validate<DirtyCenterPositionComponentData>(DirtyCenterPositionComponent, data);
                break;
            case DirectionComponent.tag:
                clazz = DirectionComponent;
                this.validate<DirectionComponentData>(DirectionComponent, data);
                break;
            case RequestedDirectionComponent.tag:
                clazz = RequestedDirectionComponent;
                this.validate<RequestedDirectionComponentData>(RequestedDirectionComponent, data);
                break;
            case TankComponent.tag:
                clazz = TankComponent;
                this.validate<TankComponentData>(TankComponent, data);
                break;
            case SpawnComponent.tag:
                clazz = SpawnComponent;
                this.validate<SpawnComponentData>(SpawnComponent, data);
                break;
            case IsMovingTrackingComponent.tag:
                clazz = IsMovingTrackingComponent;
                this.validate<IsMovingTrackingComponentData>(IsMovingTrackingComponent, data);
                break;
            case PlayerOwnedComponent.tag:
                clazz = PlayerOwnedComponent;
                this.validate<PlayerOwnedComponentData>(PlayerOwnedComponent, data);
                break;
            case EntityOwnedComponent.tag:
                clazz = EntityOwnedComponent;
                this.validate<EntityOwnedComponentData>(EntityOwnedComponent, data);
                break;
            case BulletComponent.tag:
                clazz = BulletComponent;
                this.validate<BulletComponentData>(BulletComponent, data);
                break;
            case ColorComponent.tag:
                clazz = ColorComponent;
                this.validate<ColorComponentData>(ColorComponent, data);
                break;
            case WorldEntityComponent.tag:
                clazz = WorldEntityComponent;
                this.validate<WorldEntityComponentData>(WorldEntityComponent, data);
                break;
            case MovementComponent.tag:
                clazz = MovementComponent;
                this.validate<MovementComponentData>(MovementComponent, data);
                break;
            case MovementMultipliersComponent.tag:
                clazz = MovementMultipliersComponent;
                this.validate<MovementMultipliersComponentData>(MovementMultipliersComponent, data);
                break;
            case HealthComponent.tag:
                clazz = HealthComponent;
                this.validate<HealthComponentData>(HealthComponent, data);
                break;
            case EntitySpawnerComponent.tag:
                clazz = EntitySpawnerComponent;
                this.validate<EntitySpawnerComponentData>(EntitySpawnerComponent, data);
                break;
            case EntitySpawnerActiveComponent.tag:
                clazz = EntitySpawnerActiveComponent;
                this.validate<EntitySpawnerActiveComponentData>(EntitySpawnerActiveComponent, data);
                break;
            case BulletSpawnerComponent.tag:
                clazz = BulletSpawnerComponent;
                this.validate<BulletSpawnerComponentData>(BulletSpawnerComponent, data);
                break;
            case SmokeSpawnerComponent.tag:
                clazz = SmokeSpawnerComponent;
                this.validate<SmokeSpawnerComponentData>(SmokeSpawnerComponent, data);
                break;
            case HealthBasedSmokeSpawnerComponent.tag:
                clazz = HealthBasedSmokeSpawnerComponent;
                this.validate<HealthBasedSmokeSpawnerComponentData>(HealthBasedSmokeSpawnerComponent, data);
                break;
            case TeamOwnedComponent.tag:
                clazz = TeamOwnedComponent;
                this.validate<TeamOwnedComponentData>(TeamOwnedComponent, data);
                break;
            default:
                assert(false, `Invalid tag '${tag}'`);
        }

        return {
            clazz,
            tag,
        };
    }

    getComponentClassByTag(tag: string): ComponentClassType<any> {
        return this.process(tag).clazz;
    }

    validateTagData(tag: string, data: Record<string, any>): void {
        this.process(tag, undefined, data);
    }

    validateComponentData<
        C extends Component<C>,
    >(
        clazz: ComponentClassType<C>,
        data: any,
    ): void {
        this.process(undefined, clazz, data);
    }
}
