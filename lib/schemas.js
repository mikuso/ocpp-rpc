const { getSchemaValidator } = require('./util');

const schemas = {};

schemas['ocpp1.6'] = getSchemaValidator(require('./schemas/ocpp1_6.json'));
schemas['ocpp2.0.1'] = getSchemaValidator(require('./schemas/ocpp2_0_1.json'));

module.exports = schemas;
