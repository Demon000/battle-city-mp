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
            default:
                throw new Error(`Invalid tag: ${tag}`);
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
