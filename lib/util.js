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

import packageJson from '../package.json' with {type: "json"};

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
 * @typedef {keyof rpcErrorLUT} RPCErrorCode
 */

/**
 * Get a string which identifies the current package version.
 * 
 * @returns {string}
 */
export function getPackageIdent() {
    return `${packageJson.name}/${packageJson.version} (${process.platform})`;
}

/**
 * Converts an Error into a plain old javascript object.
 * 
 * @param {Error} err 
 * @returns {*}
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
 * | Type | Description |
 * | ---- | ----------- |
 * | `GenericError` | A generic error when no more specific error is appropriate. |
 * | `NotImplemented` | Requested method is not known. |
 * | `NotSupported` | Requested method is recognised but not supported. |
 * | `InternalError` | An internal error occurred and the receiver was not able to process the requested method successfully. |
 * | `ProtocolError` | Payload for method is incomplete. |
 * | `SecurityError` | During the processing of method a security issue occurred preventing receiver from completing the method successfully. |
 * | `FormatViolation` | Payload for the method is syntactically incorrect or not conform the PDU structure for the method. |
 * | `FormationViolation` | *(Deprecated)* Same as FormatViolation. Retained for backwards compatibility with OCPP 1.6 and below. |
 * | `PropertyConstraintViolation` | Payload is syntactically correct but at least one field contains an invalid value. |
 * | `OccurrenceConstraintViolation` | Payload for the method is syntactically correct but at least one of the fields violates occurrence constraints. |
 * | `OccurenceConstraintViolation` | *(Deprecated)* Same as OccurrenceConstraintViolation. Retained for backwards compatibility with OCPP 1.6 and below. |
 * | `TypeConstraintViolation` | Payload for the method is syntactically correct but at least one of the fields violates data type constraints. |
 * | `MessageTypeNotSupported` | A message with a Message Type Number received is not supported by this implementation. |
 * | `RpcFrameworkError` | Content of the call is not a valid RPC Request, for example: MessageId could not be read. |
 *
 * @param {keyof rpcErrorLUT} errorCode - The OCPP-J RPC error code (see table above).
 * @param {string} [message] The error's message.
 * @param {Record<string, *>} [details={}] The details object to pass along with the error.
 * @returns {RPCError}
 * @group Utilities
 */
export function createRPCError(errorCode, message, details = {}) {
    const E = rpcErrorLUT[errorCode] ?? RPCGenericError;
    const err = new E(message ?? '');
    err.rpcErrorCode = errorCode;
    err.details = details;
    return err;
}


const ocpp16DeprecatedErrorCodeLUT = new Map([
    ['FormatViolation', 'FormationViolation'],
    ['OccurrenceConstraintViolation', 'OccurenceConstraintViolation'],
]);

/**
 * 
 * @param {string} errorCode 
 * @returns {string}
 */
export function lookupOcpp16DeprecatedCode(errorCode) {
    return ocpp16DeprecatedErrorCodeLUT.get(errorCode);
}
