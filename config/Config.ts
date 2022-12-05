import fs from 'fs';
import path from 'path';
import jp from 'jsonpath';
import { assert } from '@/utils/assert';
import EventEmitter from 'eventemitter3';
import { FileUtils } from '@/utils/FileUtils';

export enum ConfigEvent {
    CONFIG_SET,
}

export interface ConfigEvents {
    [ConfigEvent.CONFIG_SET]: () => void;
}

export class Config {
    private nameToData = {} as Record<string, any>;

    emitter = new EventEmitter<ConfigEvents>();

    constructor(dirPath?: string) {
        if (dirPath !== undefined) {
            this.loadDir(dirPath);
        }
    }

    loadFile(dirPath: string, fileName: string): void {
        const filePath = path.join(dirPath, fileName);
        const fileStats = fs.lstatSync(filePath);
        if (fileStats.isDirectory()) {
            return;
        }

        const data = FileUtils.readJSON5(filePath);
        const fileExtension = path.extname(fileName);
        const fileBaseName = path.basename(fileName, fileExtension);
        this.nameToData[fileBaseName] = data;
    }

    loadDir(dirPath: string): void {
        const files = fs.readdirSync(dirPath);
        for (const fileName of files) {
            this.loadFile(dirPath, fileName);
        }
    }

    getData<T = any>(name: string): T {
        const data = this.nameToData[name];
        if (data === undefined) {
            assert(false, `Invalid configuration name '${name}'`);
        }

        return data;
    }

    setMultiple(multipleNameToData: Record<string, any>): void {
        Object.assign(this.nameToData, multipleNameToData);
        this.emitter.emit(ConfigEvent.CONFIG_SET);
    }

    getDataMultiple(names: Array<string>): Record<string, any> {
        const multipleNameToData: Record<string, any> = {};

        for (const name of names) {
            const data = this.getData(name);
            multipleNameToData[name] = data;
        }

        return multipleNameToData;
    }

    findDataMember<T>(data: Record<string, any>, member: string): T | undefined {
        return jp.value(data, `$['${member}']`);
    }

    getDataMember<T>(data: Record<string, any>, member: string): T {
        const value = this.findDataMember<T>(data, member);
        assert(value !== undefined, `Invalid value for member '${member}'`);

        return value;
    }

    get<T>(name: string, path: string): T {
        const data = this.getData(name);
        return this.getDataMember(data, path);
    }

    find<T>(name: string, path: string): T | undefined {
        const data = this.getData(name);
        return this.findDataMember(data, path);
    }

    clear(): void {
        this.nameToData = {};
    }
}
