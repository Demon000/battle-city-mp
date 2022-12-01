import { GraphicsRendererComponent, GraphicsRendererComponentData } from '@/components/GraphicsRendererComponent';
import { assert as assertEquals } from 'typescript-json';
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