import fs from 'fs';
import JSON5 from 'json5';

export class FileUtils {
    static readJSON5(path: string): any {
        const rawData = fs.readFileSync(path, 'utf8');
        return JSON5.parse(rawData);
    }
}
