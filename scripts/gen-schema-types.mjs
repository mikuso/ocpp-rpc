import { compile } from 'json-schema-to-typescript';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

async function main(schemaDir, outDir) {
    const files = await readdir(schemaDir);
    
    for (const file of files) {
        if (extname(file) !== '.json') {
            continue;
        }

        const filePath = resolve(schemaDir, file);

        const schemaJson = await readFile(filePath);
        const schema = JSON.parse(schemaJson);

        const types = [];

        for (const schemaDef of schema) {
            const [method, type] = schemaDef.$id.substring(4).split('.');

            let name;
            switch (type) {
                case 'req':
                    name = method + 'Request';
                    break;
                case 'conf':
                    name = method + 'Response';
                    break;
                default:
                    throw Error('Badly formed $id:' + schemaDef.$id);
            }
            schemaDef.$id = name;

            const ts = await compile(schemaDef, name, {
                bannerComment: '',
                ignoreMinAndMaxItems: true
            });

            types.push(ts);
        }

        const typeDefFile = types.join("\n");
        const destDir = outDir || schemaDir;
        await mkdir(destDir, {recursive: true});
        const destPath = resolve(destDir, file + '.d.ts');
        await writeFile(destPath, typeDefFile);
    }
}
main(process.argv[2], process.argv[3]).catch(err => {
    console.error(err);
    process.exit(1);
});