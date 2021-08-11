import { Component, ComponentClassType } from '@/ecs/Component';
import { BoundingBoxComponent, BoundingBoxComponentData } from '@/physics/bounding-box/BoundingBoxComponent';
import { PositionComponent, PositionComponentData } from '@/physics/point/PositionComponent';
import { SizeComponent, SizeComponentData } from '@/physics/size/SizeComponent';
import { AutomaticDestroyComponent, AutomaticDestroyComponentData } from '../components/AutomaticDestroyComponent';
import { assert } from '@/utils/assert';
import { assertType } from 'typescript-is';
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
import { BulletComponent, BulletComponentData } from '@/components/BulletComponent';

export interface ProcessResults {
    clazz: ComponentClassType<any>;
    tag: string;
}

export class ComponentRegistry {
    private process(tag?: string, clazz?: ComponentClassType<any>, data?: any): ProcessResults {
        assert(tag !== undefined || clazz !== undefined);

        if (tag === undefined && clazz !== undefined) {
            tag = clazz.tag;
        }

        switch(tag) {
            case BoundingBoxComponent.tag:
                clazz = BoundingBoxComponent;
                if (data !== undefined) assertType<Partial<BoundingBoxComponentData>>(data);
                break;
            case PositionComponent.tag:
                clazz = PositionComponent;
                if (data !== undefined) assertType<Partial<PositionComponentData>>(data);
                break;
            case SizeComponent.tag:
                clazz = SizeComponent;
                if (data !== undefined) assertType<Partial<SizeComponentData>>(data);
                break;
            case AutomaticDestroyComponent.tag:
                clazz = AutomaticDestroyComponent;
                if (data !== undefined) assertType<Partial<AutomaticDestroyComponentData>>(data);
                break;
            case DestroyedComponent.tag:
                clazz = DestroyedComponent;
                if (data !== undefined) assertType<Partial<DestroyedComponentData>>(data);
                break;
            case GraphicDependenciesComponent.tag:
                clazz = GraphicDependenciesComponent;
                if (data !== undefined) assertType<Partial<GraphicDependenciesComponentData>>(data);
                break;
            case IsMovingComponent.tag:
                clazz = IsMovingComponent;
                if (data !== undefined) assertType<Partial<IsMovingComponentData>>(data);
                break;
            case DirectionAxisSnappingComponent.tag:
                clazz = DirectionAxisSnappingComponent;
                if (data !== undefined) assertType<Partial<DirectionAxisSnappingComponentData>>(data);
                break;
            case SpawnTimeComponent.tag:
                clazz = SpawnTimeComponent;
                if (data !== undefined) assertType<Partial<SpawnTimeComponentData>>(data);
                break;
            case IsUnderBushComponent.tag:
                clazz = IsUnderBushComponent;
                if (data !== undefined) assertType<Partial<IsUnderBushComponentData>>(data);
                break;
            case CenterPositionComponent.tag:
                clazz = CenterPositionComponent;
                if (data !== undefined) assertType<Partial<CenterPositionComponentData>>(data);
                break;
            case DirtyBoundingBoxComponent.tag:
                clazz = DirtyBoundingBoxComponent;
                if (data !== undefined) assertType<Partial<DirtyBoundingBoxComponentData>>(data);
                break;
            case RequestedPositionComponent.tag:
                clazz = RequestedPositionComponent;
                if (data !== undefined) assertType<Partial<RequestedPositionComponentData>>(data);
                break;
            case DirtyCenterPositionComponent.tag:
                clazz = DirtyCenterPositionComponent;
                if (data !== undefined) assertType<Partial<DirtyCenterPositionComponentData>>(data);
                break;
            case DirectionComponent.tag:
                clazz = DirectionComponent;
                if (data !== undefined) assertType<Partial<DirectionComponentData>>(data);
                break;
            case RequestedDirectionComponent.tag:
                clazz = RequestedDirectionComponent;
                if (data !== undefined) assertType<Partial<RequestedDirectionComponentData>>(data);
                break;
            case TankComponent.tag:
                clazz = TankComponent;
                if (data !== undefined) assertType<Partial<TankComponentData>>(data);
                break;
            case SpawnComponent.tag:
                clazz = SpawnComponent;
                if (data !== undefined) assertType<Partial<SpawnComponentData>>(data);
                break;
            case IsMovingTrackingComponent.tag:
                clazz = IsMovingTrackingComponent;
                if (data !== undefined) assertType<Partial<IsMovingTrackingComponentData>>(data);
                break;
            case PlayerOwnedComponent.tag:
                clazz = PlayerOwnedComponent;
                if (data !== undefined) assertType<Partial<PlayerOwnedComponentData>>(data);
                break;
            case EntityOwnedComponent.tag:
                clazz = EntityOwnedComponent;
                if (data !== undefined) assertType<Partial<EntityOwnedComponentData>>(data);
                break;
            case BulletComponent.tag:
                clazz = BulletComponent;
                if (data !== undefined) assertType<Partial<BulletComponentData>>(data);
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
