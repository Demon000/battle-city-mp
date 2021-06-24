import fs from 'fs';
import path from 'path';
import jp from 'jsonpath';
import JSON5 from 'json5';

export class Config {
    private nameToData = new Map<string, any>();

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

    get<T>(name: string, path: string): T {
        const data = this.nameToData.get(name);
        if (data === undefined) {
            throw new Error(`Invalid configuration name '${name}'`);
        }

        const value = jp.value(data, path);
        if (value === undefined) {
            throw new Error(`Invalid value for path '${path}'`);
        }

        return value as T;
    }
}
