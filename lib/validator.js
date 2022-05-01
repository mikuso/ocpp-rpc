const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { createRPCError } = require('./util');

class Validator {
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
            throw createRPCError("InternalError", `Schema [${def}] is missing`);
        }

        const res = validator(obj);
        if (!res && ajv.errors?.length > 0) {
            const [first] = ajv.errors;
            let rpcErrorCode = "FormatViolation";
            switch (first.keyword) {
                case 'additionalProperties':
                    rpcErrorCode = "PropertyConstraintViolation";
                    break;
                case 'type':
                    rpcErrorCode = "TypeConstraintViolation";
                    break;
            }

            throw createRPCError(rpcErrorCode, [first.instancePath, first.message].filter(x=>x).join(' '), first);
        }

        return res;
    }

    validateOutboundCall(schemaId, params) {

    }

    validateOutboundResponse(schmeaId, params) {

    }

    validateInboundCall(schemaId, params) {

    }

    validateInboundResponse(schemaId, params) {

    }
}

function createValidator(subprotocol, json) {
    const ajv = new Ajv();
    addFormats(ajv);
    ajv.addSchema(json);
    return new Validator(subprotocol, ajv);
}

module.exports = {Validator, createValidator};
