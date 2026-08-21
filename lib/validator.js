import fs from 'node:fs';
import path from 'node:path';
import AjvCore from 'ajv';
import Ajv04 from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import { createRPCError } from './util.js';

import draft06schema from "ajv/dist/refs/json-schema-draft-06.json" with { type: 'json' };

/** @type {Object.<string, string>} */
const errorCodeLUT = {
    'maximum'                : "FormatViolation",
    'minimum'                : "FormatViolation",
    'maxLength'              : "FormatViolation",
    'minLength'              : "FormatViolation",
    'exclusiveMaximum'       : "OccurrenceConstraintViolation",
    'exclusiveMinimum'       : "OccurrenceConstraintViolation",
    'multipleOf'             : "OccurrenceConstraintViolation",
    'maxItems'               : "OccurrenceConstraintViolation",
    'minItems'               : "OccurrenceConstraintViolation",
    'maxProperties'          : "OccurrenceConstraintViolation",
    'minProperties'          : "OccurrenceConstraintViolation",
    'additionalItems'        : "OccurrenceConstraintViolation",
    'required'               : "OccurrenceConstraintViolation",
    'pattern'                : "PropertyConstraintViolation",
    'propertyNames'          : "PropertyConstraintViolation",
    'additionalProperties'   : "PropertyConstraintViolation",
    'type'                   : "TypeConstraintViolation",
};

/**
 * JSON schema validator
 */
class Validator {
    /**
     * 
     * @param {string} subprotocol The websocket subprotocol this Validator is targeting
     * @param {AjvCore | Ajv04} ajv Instance of Ajv
     * @param {object} [options] 
     * @param {string} [options.urnNid="ocpp-rpc"] The common namespace ID used by all of the scheme IDs in the collection
     * @param {string} [options.reqSuffix=".req"] The request schema ID suffix (typically ".req" or "Request")
     * @param {string} [options.confSuffix=".conf"] The response schema ID suffix (typically ".conf" or "Response")
     */
    constructor(subprotocol, ajv, options) {
        this._subprotocol = subprotocol;
        this._ajv = ajv;
        
        options = Object.assign({
            urnNid: 'ocpp-rpc',
            reqSuffix: '.req',
            confSuffix: '.conf',
        }, options ?? {});

        this._urnNid = options.urnNid;
        this._reqSuffix = options.reqSuffix;
        this._confSuffix = options.confSuffix;
    }

    /**
     * 
     * @param {string} method An RPC method name
     * @returns {string} The base schema ID urn without any req/conf suffix
     */
    getBaseId(method) {
        return `urn:${this._urnNid}:${method}`;
    }

    /**
     * 
     * @param {string} method An RPC method name
     * @returns {string} The full request schema ID urn
     */
    getRequestId(method) {
        return this.getBaseId(method) + this._reqSuffix;
    }

    /**
     * 
     * @param {string} method An RPC method name
     * @returns {string} The full response schema ID urn
     */
    getResponseId(method) {
        return this.getBaseId(method) + this._confSuffix;
    }

    
    /**
     * The websocket subprotocol this Validator is configured for
     *
     * @readonly
     * @type {string}
     */
    get subprotocol() {
        return this._subprotocol;
    }

    /**
     * Validates params against a schema.
     *
     * @param {string} schemaId - The schema ID to validate against
     * @param {*} params - The parameters to validate
     * @returns {boolean} True if validation passes, false otherwise
     * @throws {RPCError} Throws an RPCError if validation fails or schema is missing
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
 * Removes invalid usages of 'additionalProperties' from a JSON schema.
 * @param {*} schema
 * @returns {*}
 */
function stripInvalidAdditionalProperties(schema) {
    if (typeof schema !== 'object' || schema === null) return schema;

    if (schema.type && schema.type !== 'object' && 'additionalProperties' in schema) {
        delete schema.additionalProperties;
    }

    for (const key of Object.keys(schema)) {
        schema[key] = stripInvalidAdditionalProperties(schema[key]);
    }

    return schema;
}

 /**
 * Creates a `Validator` object which can be used with the `strictModeValidators` option of
 * `RPCServer` or `RPCClient` to enable strict schema validation for a given subprotocol.
 *
 * @param {string} subprotocol The websocket subprotocol this Validator is targeting
 * @param {object|Array|string} schemaObjOrPath An array or object containing JSON Schemas. Alternatively, a path to a location where a JSON schema (or schemas) can be found.
 * @param {object} [options] 
 * @param {"draft-04"|"draft-06"|"draft-07"} [options.version="draft-07"] The JSON schema version used by this validator
 * @param {string} [options.urnNid="ocpp-rpc"] The common namespace ID (nid) used in the URN of all schema IDs in the collection
 * @param {string} [options.reqSuffix=".req"] The request schema ID suffix (e.g. `".req"` or `"Request"`). Defaults to `".req"` for backwards compatibility.
 * @param {string} [options.confSuffix=".conf"] The response schema ID suffix (e.g. `".conf"` or `"Response"`). Defaults to `".conf"` for backwards compatibility.
 * @returns {Validator} 
 * @group Utilities
 */
export function createValidator(subprotocol, schemaObjOrPath, options) {

    options = Object.assign({
        version: 'draft-07',
    }, options ?? {});

    // draft-04 requires a special version of Ajv
    const Ajv = options.version === 'draft-04' ? Ajv04 : AjvCore;
    
    const ajv = new Ajv({strictSchema: false});
    addFormats(ajv);

    switch (options.version) {
        case 'draft-04':
            // NOTE: the draft-04 schema is already added by the ajv-draft-04 module
            // so we shouldn't re-add it here.
            break;
        case 'draft-06':
            // add draft-06 support
            ajv.addMetaSchema(draft06schema);
            break;
        case 'draft-07':
        default:
            // do nothing special
            break;
    }
    
    // test if `json` is a path that points to a directory or a file
    if (typeof schemaObjOrPath === 'string') {

        let isDir = true;
        try {
            const dirCheck = fs.lstatSync(schemaObjOrPath).isDirectory();
            if (!dirCheck) throw Error("Path does not point to a directory");
        } catch (err) {
            isDir = false;
        }

        if (isDir) {
            // add all schema files in the directory
            const schemaFiles = fs.readdirSync(schemaObjOrPath).filter(file => file.toLowerCase().endsWith('.json'));
            for (const file of schemaFiles) {
                const schemaPath = path.join(schemaObjOrPath, file);
                const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
                ajv.addSchema(stripInvalidAdditionalProperties(schema));
            }
        } else {
            // add the single schema file
            const schema = JSON.parse(fs.readFileSync(schemaObjOrPath, 'utf8'));
            ajv.addSchema(stripInvalidAdditionalProperties(schema));
        }
    } else {
        // schemaObjOrPath is likely a schema object
        ajv.addSchema(stripInvalidAdditionalProperties(schemaObjOrPath));
    }

    // fix for rounding errors in multipleOf validation
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

    return new Validator(subprotocol, ajv, options);
}

