const { compile } = require('json-schema-to-typescript');
const fs = require('fs');
const ocpp1_6_json = require('./lib/schemas/ocpp1_6.json');
const ocpp2_0_1json = require('./lib/schemas/ocpp2_0_1.json');
const jsonArray = [
  {
    version: 'v16',
    json: ocpp1_6_json
  },
  {
    version: 'v201',
    json: ocpp2_0_1json
  }
];
/**
 * 
 * @param {string} id $if of schema
 * @returns {string} The name used for namespace and filename
 */
const compileSchemaId = (id) => {
  const [method, type] = id.substring(4).split('.');
  switch (type) {
    case 'req':
      return method + 'Request';
    case 'conf':
      return method + 'Response';
    default:
      throw Error('Invalid Schema $id:' + id)
  }
}
(async function loop() {
  for (const data of jsonArray) {
    console.log(data.version);
    for (const schema of data.json) {
      const name = compileSchemaId(schema.$id);
      const ts = await compile(schema, name, {
        // The array type will be too large if the maxItem property is too large.
        // Ref: https://github.com/bcherny/json-schema-to-typescript/issues/372
        ignoreMinAndMaxItems: true
      })
      await fs.writeFileSync(`./lib/types/${data.version}/${name}.d.ts`, ts);
      console.log(name);
    }
  }
})()