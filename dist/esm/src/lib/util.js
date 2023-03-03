import { RPCGenericError, RPCNotImplementedError, RPCNotSupportedError, RPCInternalError, RPCProtocolError, RPCSecurityError, RPCFormationViolationError, RPCFormatViolationError, RPCPropertyConstraintViolationError, RPCOccurenceConstraintViolationError, RPCOccurrenceConstraintViolationError, RPCTypeConstraintViolationError, RPCMessageTypeNotSupportedError, RPCFrameworkError, } from './errors';
import { name, version } from '../../package.json';
export function getPackageIdent() {
    return `${name}/${version} (${process.platform})`;
}
export function translateErrorToOCPPCode(keyword) {
    switch (keyword) {
        default:
        case 'maximum':
        case 'minimum':
        case 'maxLength':
        case 'minLength':
            return "FormatViolation";
        case 'exclusiveMaximum':
        case 'exclusiveMinimum':
        case 'multipleOf':
        case 'maxItems':
        case 'minItems':
        case 'maxProperties':
        case 'minProperties':
        case 'additionalItems':
        case 'required':
            return "OccurenceConstraintViolation";
        case 'pattern':
        case 'propertyNames':
        case 'additionalProperties':
            return "PropertyConstraintViolation";
        case 'type':
            return "TypeConstraintViolation";
    }
}
const rpcErrorLUT = {
    'GenericError': RPCGenericError,
    'NotImplemented': RPCNotImplementedError,
    'NotSupported': RPCNotSupportedError,
    'InternalError': RPCInternalError,
    'ProtocolError': RPCProtocolError,
    'SecurityError': RPCSecurityError,
    'FormationViolation': RPCFormationViolationError,
    'FormatViolation': RPCFormatViolationError,
    'PropertyConstraintViolation': RPCPropertyConstraintViolationError,
    'OccurenceConstraintViolation': RPCOccurenceConstraintViolationError,
    'OccurrenceConstraintViolation': RPCOccurrenceConstraintViolationError,
    'TypeConstraintViolation': RPCTypeConstraintViolationError,
    'MessageTypeNotSupported': RPCMessageTypeNotSupportedError,
    'RpcFrameworkError': RPCFrameworkError,
};
export function getErrorPlainObject(err) {
    var _a, _b;
    try {
        return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
    catch (e) {
        return {
            stack: (_a = err === null || err === void 0 ? void 0 : err.stack) !== null && _a !== void 0 ? _a : '',
            message: (_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : '',
        };
    }
}
export function createRPCError(type, message, details) {
    var _a;
    const E = (_a = rpcErrorLUT[type]) !== null && _a !== void 0 ? _a : RPCGenericError;
    const err = new E(message !== null && message !== void 0 ? message : '');
    err.details = details !== null && details !== void 0 ? details : {};
    return err;
}
