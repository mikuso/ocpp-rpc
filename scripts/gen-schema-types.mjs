import { compile } from 'json-schema-to-typescript';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

async function main(schemaDir, outDir) {
    const files = await readdir(schemaDir);
    
    for (const file of files) {
        if (extname(file) !== '.json') {
            continue;
        }

        const filePath = resolve(schemaDir, file);
        const protoName = basename(file, '.json').toUpperCase().replace(/\./g, '_');

        const schemaJson = await readFile(filePath);
        const schema = JSON.parse(schemaJson);

        const payloadTypes = []; // typescript interface definitions of request/response payloads
        const methodMapping = new Map(); // a map of method names to payload interfaces

        for (const schemaDef of schema) {
            const [method, type] = schemaDef.$id.substring(4).split('.');

            if (!methodMapping.has(method)) {
                methodMapping.set(method, {});
            }

            let name;
            switch (type) {
                case 'req':
                    name = method + 'Request';
                    methodMapping.get(method).req = name;
                    break;
                case 'conf':
                    name = method + 'Response';
                    methodMapping.get(method).conf = name;
                    break;
                default:
                    throw Error('Badly formed $id:' + schemaDef.$id);
            }
            schemaDef.$id = name;

            const ts = await compile(schemaDef, name, {
                bannerComment: '',
                ignoreMinAndMaxItems: true
            });

            payloadTypes.push(ts);
        }

        let methodsInterface = Array.from(methodMapping.entries()).map(([method, interf]) => {
            return `  ${method}: {req: ${interf.req}, conf: ${interf.conf}};`
        }).join('\n');
        methodsInterface = `export interface ${protoName}Methods {\n${methodsInterface}\n}`;

        const typeDefFile = [
            payloadTypes.join("\n"),
            methodsInterface,
        ].join("\n");
        
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