import { createValidator } from './validator';

import * as ocpp16 from './schemas/ocpp1_6.json';
import * as ocpp201 from './schemas/ocpp2_0_1.json';

export default [
    createValidator('ocpp1.6', ocpp16),
    createValidator('ocpp2.0.1', ocpp201),
];
