"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("./validator");
const ocpp16 = require("./schemas/ocpp1_6.json");
const ocpp201 = require("./schemas/ocpp2_0_1.json");
exports.default = [
    (0, validator_1.createValidator)('ocpp1.6', ocpp16),
    (0, validator_1.createValidator)('ocpp2.0.1', ocpp201),
];
