import { Component, ComponentClassType } from '@/ecs/Component';
import NewEntityComponent, { NewEntityComponentData } from '@/entity/NewEntityComponent';
import BoundingBoxComponent, { BoundingBoxComponentData } from '@/physics/bounding-box/BoundingBoxComponent';
import CollisionComponent, { CollisionComponentData } from '@/physics/collisions/CollisionComponent';
import PositionComponent, { PositionComponentData } from '@/physics/point/PositionComponent';
import SizeComponent, { SizeComponentData } from '@/physics/size/SizeComponent';
import { assert } from '@/utils/assert';
import { assertType } from 'typescript-is';

export type DataOfComponent<T> =
    T extends NewEntityComponent ? NewEntityComponentData :
    T extends BoundingBoxComponent ? BoundingBoxComponentData :
    T extends CollisionComponent ? CollisionComponentData :
    T extends PositionComponent ? PositionComponentData :
    T extends SizeComponent ? SizeComponentData :
    never;

interface ProcessResults {
    clazz: ComponentClassType<any>;
    tag: string;
}

export default class ComponentRegistry {
    private process(tag?: string, clazz?: ComponentClassType<any>, data?: any): ProcessResults {
        assert(tag !== undefined || clazz !== undefined);
        
        if (tag === undefined) {
            tag = clazz!.tag;
        }

        if (tag === NewEntityComponent.tag) {
            clazz = NewEntityComponent;
            if (data !== undefined) assertType<Partial<DataOfComponent<NewEntityComponent>>>(data);
        } else if (tag === BoundingBoxComponent.tag) {
            clazz = BoundingBoxComponent;
            if (data !== undefined) assertType<Partial<DataOfComponent<BoundingBoxComponent>>>(data);
        } else if (tag === CollisionComponent.tag) {
            clazz = CollisionComponent;
            if (data !== undefined) assertType<Partial<DataOfComponent<CollisionComponent>>>(data);
        } else if (tag === PositionComponent.tag) {
            clazz = PositionComponent;
            if (data !== undefined) assertType<Partial<DataOfComponent<PositionComponent>>>(data);
        } else if (tag === SizeComponent.tag) {
            clazz = SizeComponent;
            if (data !== undefined) assertType<Partial<DataOfComponent<SizeComponent>>>(data);
        } else {
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

    validateTagData(tag: string, data: any): void {
        this.process(tag, undefined, data);
    }

    validateComponentData<C extends Component<C>>(clazz: ComponentClassType<C>, data: any): void {
        this.process(undefined, clazz, data);
    }
}
