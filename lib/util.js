const errors = require('./errors');
const package = require('../package.json');

const rpcErrorLUT = {
    'GenericError'                  : errors.RPCGenericError,
    'NotImplemented'                : errors.RPCNotImplementedError,
    'NotSupported'                  : errors.RPCNotSupportedError,
    'InternalError'                 : errors.RPCInternalError,
    'ProtocolError'                 : errors.RPCProtocolError,
    'SecurityError'                 : errors.RPCSecurityError,
    'FormationViolation'            : errors.RPCFormationViolationError,
    'FormatViolation'               : errors.RPCFormatViolationError,
    'PropertyConstraintViolation'   : errors.RPCPropertyConstraintViolationError,
    'OccurenceConstraintViolation'  : errors.RPCOccurenceConstraintViolationError,
    'OccurrenceConstraintViolation' : errors.RPCOccurrenceConstraintViolationError,
    'TypeConstraintViolation'       : errors.RPCTypeConstraintViolationError,
    'MessageTypeNotSupported'       : errors.RPCMessageTypeNotSupportedError,
    'RpcFrameworkError'             : errors.RPCFrameworkError,
};

function getPackageIdent() {
    return `${package.name}/${package.version} (${process.platform})`;
}

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
    const E = rpcErrorLUT[type] ?? errors.RPCGenericError;
    const err = new E(message ?? '');
    err.details = details ?? {};
    return err;
}

module.exports = {
    getErrorPlainObject,
    createRPCError,
    getPackageIdent,
};