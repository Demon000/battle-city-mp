import * as fs from 'fs';
import * as path from 'path';

const componentsDir = 'components';
const indexFilePath = path.join(componentsDir, 'index.ts');
const ignoredFiles = [
    'index.ts',
    'GraphicsRendererComponent.ts',
    'client-index.ts',
];

const files = fs.readdirSync(componentsDir)
    .filter(file => file.endsWith('.ts') && !ignoredFiles.includes(file))
    .map(file => path.basename(file, '.ts'));

const indexContent = files.map(file => `export * from './${file}';`).join('\n') + '\n';

fs.writeFileSync(indexFilePath, indexContent, 'utf8');
