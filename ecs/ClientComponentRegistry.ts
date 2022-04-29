import { GraphicsRendererComponent, GraphicsRendererComponentData } from '@/components/GraphicsRendererComponent';
import { assertEquals } from 'typescript-is';
import { ComponentClassType } from './Component';
import { ComponentRegistry } from './ComponentRegistry';

export class ClientComponentRegistry extends ComponentRegistry {
    protected lookupAndValidate(
        tag: string,
        data: any,
    ): ComponentClassType<any> | undefined {
        switch (tag) {
            case GraphicsRendererComponent.tag:
            case GraphicsRendererComponent.name:
                assertEquals<Partial<GraphicsRendererComponentData>>(data);
                return GraphicsRendererComponent;
        }

        return super.lookupAndValidate(tag, data);
    }
}