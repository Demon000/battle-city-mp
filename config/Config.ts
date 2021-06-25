import fs from 'fs';
import path from 'path';
import jp from 'jsonpath';
import JSON5 from 'json5';

export class Config {
    private nameToData = {} as Record<string, any>;

    loadAll(dirPath: string): void {
        const files = fs.readdirSync(dirPath);
        for (const fileName of files) {
            const filePath = path.join(dirPath, fileName);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON5.parse(rawData);

            const fileExtension = path.extname(fileName);
            const fileBaseName = path.basename(fileName, fileExtension);
            this.nameToData.set(fileBaseName, data);
        }
    }

    getData(name: string): any {
        const data = this.nameToData[name];
        if (data === undefined) {
            throw new Error(`Invalid configuration name '${name}'`);
        }

        return data;
    }

    getDataMultiple(names: Array<string>): Record<string, any> {
        const data = {};

        for (const name of names) {
            const data = this.getData(name);
            this.nameToData[name] = data;
        }

        return data;
    }

    getDataPath<T>(data: any, path: string): T {
        const value = jp.value(data, path);
        if (value === undefined) {
            throw new Error(`Invalid value for path '${path}'`);
        }

        return value;
    }

    get<T>(name: string, path: string): T {
        const data = this.getData(name);
        return this.getDataPath(name, path);
    }
}
