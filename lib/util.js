import {
    RPCError,
    RPCGenericError,
    RPCNotImplementedError,
    RPCNotSupportedError,
    RPCInternalError,
    RPCProtocolError,
    RPCSecurityError,
    RPCFormationViolationError,
    RPCFormatViolationError,
    RPCPropertyConstraintViolationError,
    RPCOccurenceConstraintViolationError,
    RPCOccurrenceConstraintViolationError,
    RPCTypeConstraintViolationError,
    RPCMessageTypeNotSupportedError,
    RPCFrameworkError
} from './errors.js';

// import { name, version } from '../package.json';
const name = '';
const version = '';

const rpcErrorLUT = {
    'GenericError'                  : RPCGenericError,
    'NotImplemented'                : RPCNotImplementedError,
    'NotSupported'                  : RPCNotSupportedError,
    'InternalError'                 : RPCInternalError,
    'ProtocolError'                 : RPCProtocolError,
    'SecurityError'                 : RPCSecurityError,
    'FormationViolation'            : RPCFormationViolationError,
    'FormatViolation'               : RPCFormatViolationError,
    'PropertyConstraintViolation'   : RPCPropertyConstraintViolationError,
    'OccurenceConstraintViolation'  : RPCOccurenceConstraintViolationError,
    'OccurrenceConstraintViolation' : RPCOccurrenceConstraintViolationError,
    'TypeConstraintViolation'       : RPCTypeConstraintViolationError,
    'MessageTypeNotSupported'       : RPCMessageTypeNotSupportedError,
    'RpcFrameworkError'             : RPCFrameworkError,
};

/**
 * Get a string which identifies the current package version.
 * 
 * @returns {string}
 */
export function getPackageIdent() {
    return `${name}/${version} (${process.platform})`;
}

/**
 * Converts an Error into a plain old javascript object.
 * 
 * @param {Error} err 
 * @returns {object}
 */
export function getErrorPlainObject(err) {
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

/**
 * Creates an RPCError which can be thrown from a call handler to return a non-generic error response.
 * 
 * @param {string} type - An OCPP error type.
 * @param {string} [message] The error's message.
 * @param {object} [details] The details object to pass along with the error.
 * @returns {RPCError}
 */
export function createRPCError(type, message, details = {}) {
    const E = rpcErrorLUT[type] ?? RPCGenericError;
    const err = new E(message ?? '');
    err.details = details;
    return err;
}
