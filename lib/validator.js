import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createRPCError } from './util.js';

/** @type {Object.<string, string>} */
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

/**
 * A schema validator for use with strictMode.
 */
export class Validator {

    /**
     * 
     * @param {string} subprotocol 
     * @param {Ajv} ajv 
     */
    constructor(subprotocol, ajv) {
        this._subprotocol = subprotocol;
        this._ajv = ajv;
    }

    get subprotocol() {
        return this._subprotocol;
    }

    /**
     * 
     * @param {string} schemaId 
     * @param {*} params 
     * @returns boolean
     */
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

/**
 * Create a Validator instance for the specific subprotocol and JSON schema provided.
 * 
 * @param {string} subprotocol The subprotocol name as used by the websocket.
 * @param {*} json The JSON schema to serve as the basis for the validator.
 * @returns {Validator}
 */
export function createValidator(subprotocol, json) {
    const ajv = new Ajv({strictSchema: false});
    addFormats(ajv);
    ajv.addSchema(json);

    ajv.removeKeyword("multipleOf");
    ajv.addKeyword({
        keyword: "multipleOf",
        type: "number",
        compile(schema) {
            return data => {
                const result = data / schema;
                const epsilon = 1e-6; // small value to account for floating point precision errors
                return Math.abs(Math.round(result) - result) < epsilon;
            };
        },
        errors: false,
        metaSchema: {
            type: "number",
        },
    });

    return new Validator(subprotocol, ajv);
}

