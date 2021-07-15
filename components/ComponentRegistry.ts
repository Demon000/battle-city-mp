import { Component, ComponentClassType } from '@/ecs/Component';
import { NewEntityComponent, NewEntityComponentData } from '@/entity/NewEntityComponent';
import { BoundingBoxComponent, BoundingBoxComponentData } from '@/physics/bounding-box/BoundingBoxComponent';
import { CollisionComponent, CollisionComponentData } from '@/physics/collisions/CollisionComponent';
import { PositionComponent, PositionComponentData } from '@/physics/point/PositionComponent';
import { SizeComponent, SizeComponentData } from '@/physics/size/SizeComponent';
import { AutomaticDestroyComponent, AutomaticDestroyComponentData } from './AutomaticDestroyComponent';
import { assert } from '@/utils/assert';
import { assertType } from 'typescript-is';

/* eslint-disable @typescript-eslint/indent */
export type DataOfComponent<T> =
    T extends NewEntityComponent ? NewEntityComponentData :
    T extends BoundingBoxComponent ? BoundingBoxComponentData :
    T extends CollisionComponent ? CollisionComponentData :
    T extends PositionComponent ? PositionComponentData :
    T extends SizeComponent ? SizeComponentData :
    never;

export interface ProcessResults {
    clazz: ComponentClassType<any>;
    tag: string;
}

export class ComponentRegistry {
    private process(tag?: string, clazz?: ComponentClassType<any>, data?: any): ProcessResults {
        assert(tag !== undefined || clazz !== undefined);
        
        if (tag === undefined && clazz !== undefined) {
            tag = clazz.TAG;
        }

        switch(tag) {
            case NewEntityComponent.tag:
                clazz = NewEntityComponent;
                if (data !== undefined) assertType<Partial<DataOfComponent<NewEntityComponent>>>(data);
                break;
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
