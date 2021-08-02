import { Component, ComponentClassType } from '@/ecs/Component';
import { BoundingBoxComponent, BoundingBoxComponentData } from '@/physics/bounding-box/BoundingBoxComponent';
import { CollisionComponent, CollisionComponentData } from '@/physics/collisions/CollisionComponent';
import { PositionComponent, PositionComponentData } from '@/physics/point/PositionComponent';
import { SizeComponent, SizeComponentData } from '@/physics/size/SizeComponent';
import { AutomaticDestroyComponent, AutomaticDestroyComponentData } from '../components/AutomaticDestroyComponent';
import { assert } from '@/utils/assert';
import { assertType } from 'typescript-is';
import { DestroyedComponent, DestroyedComponentData } from '@/components/DestroyedComponent';
import { GraphicDependenciesComponent, GraphicDependenciesComponentData } from '@/components/GraphicDependenciesComponent';

/* eslint-disable @typescript-eslint/indent */
export type DataOfComponent<T> =
    T extends BoundingBoxComponent ? BoundingBoxComponentData :
    T extends CollisionComponent ? CollisionComponentData :
    T extends PositionComponent ? PositionComponentData :
    T extends SizeComponent ? SizeComponentData :
    T extends AutomaticDestroyComponent ? AutomaticDestroyComponentData :
    T extends DestroyedComponent ? DestroyedComponentData :
    T extends GraphicDependenciesComponent ? GraphicDependenciesComponentData :
    never;

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
                if (data !== undefined) assertType<Partial<DataOfComponent<BoundingBoxComponent>>>(data);
                break;
            case CollisionComponent.tag:
                clazz = CollisionComponent;
                if (data !== undefined) assertType<Partial<DataOfComponent<CollisionComponent>>>(data);
                break;
            case PositionComponent.tag:
                clazz = PositionComponent;
                if (data !== undefined) assertType<Partial<DataOfComponent<PositionComponent>>>(data);
                break;
            case SizeComponent.tag:
                clazz = SizeComponent;
                if (data !== undefined) assertType<Partial<DataOfComponent<SizeComponent>>>(data);
                break;
            case AutomaticDestroyComponent.tag:
                clazz = AutomaticDestroyComponent;
                if (data !== undefined) assertType<Partial<DataOfComponent<AutomaticDestroyComponent>>>(data);
                break;
            case DestroyedComponent.tag:
                clazz = DestroyedComponent;
                if (data !== undefined) assertType<Partial<DataOfComponent<DestroyedComponent>>>(data);
                break;
            case GraphicDependenciesComponent.tag:
                clazz = GraphicDependenciesComponent;
                if (data !== undefined) assertType<Partial<DataOfComponent<GraphicDependenciesComponent>>>(data);
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

    validateComponentData<C extends Component<C>>(clazz: ComponentClassType<C>, data: Record<string, any>): void {
        this.process(undefined, clazz, data);
    }
}
