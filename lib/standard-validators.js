import { createValidator } from './validator.js';

import OCPP16 from './schemas/ocpp1_6.json' assert {type: "json"};
import OCPP201 from './schemas/ocpp2_0_1.json' assert {type: "json"};

export default [
    createValidator('ocpp1.6', OCPP16),
    createValidator('ocpp2.0.1', OCPP201),
];