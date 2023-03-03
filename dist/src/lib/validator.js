"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidator = exports.Validator = void 0;
const ajv_1 = require("ajv");
const ajv_formats_1 = require("ajv-formats");
const util_1 = require("./util");
class Validator {
    _subprotocol;
    _ajv;
    constructor(subprotocol, ajv) {
        this._subprotocol = subprotocol;
        this._ajv = ajv;
    }
    get subprotocol() {
        return this._subprotocol;
    }
    validate(schemaId, params) {
        const validator = this._ajv.getSchema(schemaId);
        if (!validator) {
            throw (0, util_1.createRPCError)("ProtocolError", `Schema '${schemaId}' is missing from subprotocol schema '${this._subprotocol}'`);
        }
        const res = validator(params);
        if (!res && validator.errors?.length) {
            const first = validator.errors[0];
            const rpcErrorCode = (0, util_1.translateErrorToOCPPCode)(first.keyword);
            throw (0, util_1.createRPCError)(rpcErrorCode, this._ajv.errorsText(validator.errors), {
                errors: validator.errors,
                data: params,
            });
        }
        return res;
    }
}
exports.Validator = Validator;
function createValidator(subprotocol, json) {
    const ajv = new ajv_1.default({ strictSchema: false });
    (0, ajv_formats_1.default)(ajv);
    ajv.addSchema(json);
    return new Validator(subprotocol, ajv);
}
exports.createValidator = createValidator;
module.exports = { Validator, createValidator };
