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

    // OCPP 1.6 and 2.0.1 schemas use `urn:Action.req` / `urn:Action.conf` for
    // the request/response `$id`s. OCPP 2.1 schemas use `urn:ActionRequest` /
    // `urn:ActionResponse`. Internally we normalize both styles to the 2.1 form
    // so schema lookups work uniformly across versions, regardless of which
    // side of the upgrade a given subprotocol's bundled schemas lives on.
    static normalizeSchemaId(schemaId) {
        if (typeof schemaId !== 'string') return schemaId;
        if (schemaId.endsWith('.req')) return schemaId.slice(0, -4) + 'Request';
        if (schemaId.endsWith('.conf')) return schemaId.slice(0, -5) + 'Response';
        return schemaId;
    }

    get subprotocol() {
        return this._subprotocol;
    }

    validate(schemaId, params) {
        const normalizedId = Validator.normalizeSchemaId(schemaId);
        const validator = this._ajv.getSchema(normalizedId);

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
    const ajv = new Ajv({strict: false});
    addFormats(ajv);
    const normalized = Array.isArray(json)
        ? json.map(schema => schema && schema.$id
            ? { ...schema, $id: Validator.normalizeSchemaId(schema.$id) }
            : schema)
        : json;
    ajv.addSchema(normalized);

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

module.exports = {Validator, createValidator};
