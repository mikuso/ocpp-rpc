import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createRPCError, translateErrorToOCPPCode } from './util';
export class Validator {
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
            throw createRPCError("ProtocolError", `Schema '${schemaId}' is missing from subprotocol schema '${this._subprotocol}'`);
        }
        const res = validator(params);
        if (!res && validator.errors?.length) {
            const first = validator.errors[0];
            const rpcErrorCode = translateErrorToOCPPCode(first.keyword);
            throw createRPCError(rpcErrorCode, this._ajv.errorsText(validator.errors), {
                errors: validator.errors,
                data: params,
            });
        }
        return res;
    }
}
export function createValidator(subprotocol, json) {
    const ajv = new Ajv({ strictSchema: false });
    addFormats(ajv);
    ajv.addSchema(json);
    return new Validator(subprotocol, ajv);
}
module.exports = { Validator, createValidator };
