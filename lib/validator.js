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
            throw createRPCError("ProtocolError", `Schema '${schemaId}' is missing from subprotocol schema '${this._subprotocol}'`);
        }

        const res = validator(params);
        if (!res && validator.errors?.length > 0) {
            const [first] = validator.errors;
            let rpcErrorCode = "FormatViolation";
            switch (first.keyword) {
                case 'maximum':
                case 'minimum':
                case 'maxLength':
                case 'minLength':
                    rpcErrorCode = "FormatViolation";
                    break;
                case 'exclusiveMaximum':
                case 'exclusiveMinimum':
                case 'multipleOf':
                case 'maxItems':
                case 'minItems':
                case 'maxProperties':
                case 'minProperties':
                case 'additionalItems':
                case 'required':
                    rpcErrorCode = "OccurenceConstraintViolation";
                    break;
                case 'pattern':
                case 'propertyNames':
                case 'additionalProperties':
                    rpcErrorCode = "PropertyConstraintViolation";
                    break;
                case 'type':
                    rpcErrorCode = "TypeConstraintViolation";
                    break;
            }

            throw createRPCError(rpcErrorCode, this._ajv.errorsText(validator.errors), {
                errors: validator.errors,
                data: params,
            });
        }

        return res;
    }
}

function createValidator(subprotocol, json) {
    const ajv = new Ajv();
    addFormats(ajv);
    ajv.addSchema(json);
    return new Validator(subprotocol, ajv);
}

module.exports = {Validator, createValidator};
