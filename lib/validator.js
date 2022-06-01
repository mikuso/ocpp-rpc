const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { createRPCError } = require('./util');

const errorCodeLUT = {
    'maximum'                : "FormatViolation",
    'minimum'                : "FormatViolation",
    'maxLength'              : "FormatViolation",
    'minLength'              : "FormatViolation",
    'exclusiveMaximum'       : "OccurenceConstraintViolation",
    'exclusiveMinimum'       : "OccurenceConstraintViolation",
    'multipleOf'             : "OccurenceConstraintViolation",
    'maxItems'               : "OccurenceConstraintViolation",
    'minItems'               : "OccurenceConstraintViolation",
    'maxProperties'          : "OccurenceConstraintViolation",
    'minProperties'          : "OccurenceConstraintViolation",
    'additionalItems'        : "OccurenceConstraintViolation",
    'required'               : "OccurenceConstraintViolation",
    'pattern'                : "PropertyConstraintViolation",
    'propertyNames'          : "PropertyConstraintViolation",
    'additionalProperties'   : "PropertyConstraintViolation",
    'type'                   : "TypeConstraintViolation",
};

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
            const rpcErrorCode = errorCodeLUT[first.keyword] ?? "FormatViolation";

            throw createRPCError(rpcErrorCode, this._ajv.errorsText(validator.errors), {
                errors: validator.errors,
                data: params,
            });
        }

        return res;
    }
}

function createValidator(subprotocol, json) {
    const ajv = new Ajv({strictSchema: false});
    addFormats(ajv);
    ajv.addSchema(json);
    return new Validator(subprotocol, ajv);
}

module.exports = {Validator, createValidator};
