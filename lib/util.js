const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const errors = require('./errors');

function getErrorPlainObject(err) {
    try {

        // (nasty hack)
        // attempt to serialise into JSON to ensure the error is, in fact, serialisable
        return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));

    } catch (e) {
        // cannot serialise into JSON.
        // return just stack and message instead
        return {
            stack: err.stack,
            message: err.message,
        };
    }
}

function createRPCError(type, message, details) {
    let E = errors.RPCGenericError;
    switch (type) {
        case 'GenericError': E = errors.RPCGenericError; break;
        case 'NotImplemented': E = errors.RPCNotImplementedError; break;
        case 'NotSupported': E = errors.RPCNotSupportedError; break;
        case 'InternalError': E = errors.RPCInternalError; break;
        case 'ProtocolError': E = errors.RPCProtocolError; break;
        case 'SecurityError': E = errors.RPCSecurityError; break;
        case 'FormationViolation': E = errors.RPCFormationViolationError; break;
        case 'FormatViolation': E = errors.RPCFormatViolationError; break;
        case 'PropertyConstraintViolation': E = errors.RPCPropertyConstraintViolationError; break;
        case 'OccurenceConstraintViolation': E = errors.RPCOccurenceConstraintViolationError; break;
        case 'TypeConstraintViolation': E = errors.RPCTypeConstraintViolationError; break;
        case 'MessageTypeNotSupported': E = errors.RPCMessageTypeNotSupportedError; break;
        case 'RpcFrameworkError': E = errors.RPCFrameworkError; break;
    }
    const err = new E(message ?? '');
    err.details = details ?? {};
    return err;
}

function getSchemaValidator(json) {
    const ajv = new Ajv();
    addFormats(ajv);
    ajv.addSchema(json);
    return (def, obj) => {
        const res = ajv.validate(def, obj);
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
    };
}

module.exports = {
    getErrorPlainObject,
    createRPCError,
    getSchemaValidator,
};