const path = require('node:path');
const { createValidator } = require('./validator');

module.exports = [
    createValidator('ocpp1.6',
        path.join(__dirname, '../schemas/openchargealliance/ocpp1.6/'),
        {
            version: 'draft-04',
            urnNid: 'OCPP:1.6:2019:12',
            reqSuffix: 'Request',
            confSuffix: 'Response'
        }
    ),
    createValidator('ocpp2.0.1',
        path.join(__dirname, '../schemas/openchargealliance/ocpp2.0.1/'),
        {
            version: 'draft-06',
            urnNid: 'OCPP:Cp:2:2020:3',
            reqSuffix: 'Request',
            confSuffix: 'Response'
        }
    ),
    createValidator('ocpp2.1',
        path.join(__dirname, '../schemas/openchargealliance/ocpp2.1/'),
        {
            version: 'draft-06',
            urnNid: 'OCPP:Cp:2:2025:1',
            reqSuffix: 'Request',
            confSuffix: 'Response'
        }
    ),
];
