import { ClazzOrTag, Component, ComponentClassType, ComponentValidator } from '@/ecs/Component';
import { assert } from '@/utils/assert';

const tagComponentLookupTable = new Map<string, ComponentClassType<any>>;
const tagValidatorLookupTable = new Map<string, ComponentValidator<any>>;

export function registerComponent<V, C extends Component>(
    clazz: ComponentClassType<C>,
    validator: ComponentValidator<V>,
): void {
    let existingClazz;

    existingClazz = tagComponentLookupTable.get(clazz.name);
    assert(existingClazz === undefined || existingClazz === clazz);
    tagComponentLookupTable.set(clazz.name, clazz);

    existingClazz = tagComponentLookupTable.get(clazz.tag);
    assert(existingClazz === undefined || existingClazz === clazz);
    tagComponentLookupTable.set(clazz.tag, clazz);

    let existingValidator;

    existingValidator = tagValidatorLookupTable.get(clazz.name);
    assert(existingValidator === undefined || existingValidator === validator);
    tagValidatorLookupTable.set(clazz.name, validator);

    existingValidator = tagValidatorLookupTable.get(clazz.tag);
    assert(existingValidator === undefined || existingValidator === validator);
    tagValidatorLookupTable.set(clazz.tag, validator);
}

export class ComponentLookupTable {
    protected lookupAndValidate(
        tag: string,
        data: any,
    ): ComponentClassType<any> | undefined {
        const clazz = tagComponentLookupTable.get(tag);
        if (clazz === undefined) {
            return clazz;
        }

        if (data !== undefined) {
            const validator = tagValidatorLookupTable.get(tag);
            assert(validator !== undefined);
            try {
                validator(data);
            } catch (err) {
                console.log(`Failed to validate data for component '${tag}'`, data);
                throw err;
            }
        }

        return clazz;
    }

    lookup<C extends Component>(
        clazzOrTag: ClazzOrTag<C>,
        data?: any,
    ): ComponentClassType<C> {
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
