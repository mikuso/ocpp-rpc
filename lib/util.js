const errors = require('./errors');

function getErrorPlainObject(err) {
    try {

        // (nasty hack)
        // attempt to serialise into JSON to ensure the error is, in fact, serialisable
        return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));

    } catch (err) {
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
        case 'PropertyConstraintViolation': E = errors.RPCPropertyConstraintViolationError; break;
        case 'OccurenceConstraintViolation': E = errors.RPCOccurenceConstraintViolationError; break;
        case 'TypeConstraintViolation': E = errors.RPCTypeConstraintViolationError; break;
    }
    const err = new E(message ?? '');
    err.details = details ?? {};
    return err;
}

module.exports = {
    getErrorPlainObject,
    createRPCError,
};