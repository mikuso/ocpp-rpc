import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { createValidator } from './validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
    createValidator('ocpp1.6',
        join(__dirname, '../schemas/openchargealliance/ocpp1.6/'),
        {
            version: 'draft-04',
            urnNid: 'OCPP:1.6:2019:12',
            reqSuffix: 'Request',
            confSuffix: 'Response'
        }
    ),
    createValidator('ocpp2.0.1',
        join(__dirname, '../schemas/openchargealliance/ocpp2.0.1/'),
        {
            version: 'draft-06',
            urnNid: 'OCPP:Cp:2:2020:3',
            reqSuffix: 'Request',
            confSuffix: 'Response'
        }
    ),
    createValidator('ocpp2.1',
        join(__dirname, '../schemas/openchargealliance/ocpp2.1/'),
        {
            version: 'draft-06',
            urnNid: 'OCPP:Cp:2:2025:1',
            reqSuffix: 'Request',
            confSuffix: 'Response'
        }
    ),
];
