"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRPCError = exports.getErrorPlainObject = exports.translateErrorToOCPPCode = exports.getPackageIdent = void 0;
const errors_1 = require("./errors");
const package_json_1 = require("../../package.json");
function getPackageIdent() {
    return `${package_json_1.name}/${package_json_1.version} (${process.platform})`;
}
exports.getPackageIdent = getPackageIdent;
function translateErrorToOCPPCode(keyword) {
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
exports.translateErrorToOCPPCode = translateErrorToOCPPCode;
const rpcErrorLUT = {
    'GenericError': errors_1.RPCGenericError,
    'NotImplemented': errors_1.RPCNotImplementedError,
    'NotSupported': errors_1.RPCNotSupportedError,
    'InternalError': errors_1.RPCInternalError,
    'ProtocolError': errors_1.RPCProtocolError,
    'SecurityError': errors_1.RPCSecurityError,
    'FormationViolation': errors_1.RPCFormationViolationError,
    'FormatViolation': errors_1.RPCFormatViolationError,
    'PropertyConstraintViolation': errors_1.RPCPropertyConstraintViolationError,
    'OccurenceConstraintViolation': errors_1.RPCOccurenceConstraintViolationError,
    'OccurrenceConstraintViolation': errors_1.RPCOccurrenceConstraintViolationError,
    'TypeConstraintViolation': errors_1.RPCTypeConstraintViolationError,
    'MessageTypeNotSupported': errors_1.RPCMessageTypeNotSupportedError,
    'RpcFrameworkError': errors_1.RPCFrameworkError,
};
function getErrorPlainObject(err) {
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
exports.getErrorPlainObject = getErrorPlainObject;
function createRPCError(type, message, details) {
    var _a;
    const E = (_a = rpcErrorLUT[type]) !== null && _a !== void 0 ? _a : errors_1.RPCGenericError;
    const err = new E(message !== null && message !== void 0 ? message : '');
    err.details = details !== null && details !== void 0 ? details : {};
    return err;
}
exports.createRPCError = createRPCError;
