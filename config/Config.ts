import fs from 'fs';
import path from 'path';
import jp from 'jsonpath';
import JSON5 from 'json5';

export class Config {
    private nameToData = {} as Record<string, any>;

    constructor(dirPath?: string) {
        if (dirPath !== undefined) {
            this.loadAll(dirPath);
        }
    }

    loadAll(dirPath: string): void {
        const files = fs.readdirSync(dirPath);
        for (const fileName of files) {
            const filePath = path.join(dirPath, fileName);
            const fileStats = fs.lstatSync(filePath);
            if (fileStats.isDirectory()) {
                continue;
            }

            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON5.parse(rawData);

            const fileExtension = path.extname(fileName);
            const fileBaseName = path.basename(fileName, fileExtension);
            this.nameToData[fileBaseName] = data;
        }
    }

    getData<T = any>(name: string): T {
        const data = this.nameToData[name];
        if (data === undefined) {
            throw new Error(`Invalid configuration name '${name}'`);
        }

        return data;
    }

    setMultiple(multipleNameToData: Record<string, any>): void {
        Object.assign(this.nameToData, multipleNameToData);
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
        if (value === undefined) {
            throw new Error(`Invalid value for member '${member}'`);
        }

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
}
