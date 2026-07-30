const fs = require('node:fs');
const path = require('node:path');
const AjvCore = require('ajv');
const Ajv04 = require('ajv-draft-04');
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

    getRequestId(method) {
        return `urn:${this._urnNid}:${method}${this._reqSuffix}`;
    }

    getResponseId(method) {
        return `urn:${this._urnNid}:${method}${this._confSuffix}`;
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

function createValidator(subprotocol, schemaObjOrPath, options) {

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
            ajv.addMetaSchema(require("ajv/dist/refs/json-schema-draft-06.json"));
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
                ajv.addSchema(schema);
            }
        } else {
            // add the single schema file
            const schema = JSON.parse(fs.readFileSync(schemaObjOrPath, 'utf8'));
            ajv.addSchema(schema);
        }
    } else {
        // schemaObjOrPath is likely a schema object
        ajv.addSchema(schemaObjOrPath);
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

module.exports = {Validator, createValidator};
