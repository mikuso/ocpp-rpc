import { RPCGenericError, RPCNotImplementedError, RPCNotSupportedError, RPCInternalError, RPCProtocolError, RPCSecurityError, RPCFormationViolationError, RPCFormatViolationError, RPCPropertyConstraintViolationError, RPCOccurenceConstraintViolationError, RPCOccurrenceConstraintViolationError, RPCTypeConstraintViolationError, RPCMessageTypeNotSupportedError, RPCFrameworkError } from './errors';
export type OCPPErrorType = 'GenericError' | 'NotImplemented' | 'NotSupported' | 'InternalError' | 'ProtocolError' | 'SecurityError' | 'FormationViolation' | 'FormatViolation' | 'PropertyConstraintViolation' | 'OccurenceConstraintViolation' | 'OccurrenceConstraintViolation' | 'TypeConstraintViolation' | 'MessageTypeNotSupported' | 'RpcFrameworkError';
export declare function getPackageIdent(): string;
export declare function translateErrorToOCPPCode(keyword: string): OCPPErrorType;
interface ErrorPlainObject {
    stack: string;
    message: string;
}
export declare function getErrorPlainObject(err: Error): ErrorPlainObject;
export declare function createRPCError(type: OCPPErrorType, message?: string, details?: object): RPCGenericError | RPCNotImplementedError | RPCNotSupportedError | RPCInternalError | RPCProtocolError | RPCSecurityError | RPCFormatViolationError | RPCFormationViolationError | RPCPropertyConstraintViolationError | RPCOccurenceConstraintViolationError | RPCOccurrenceConstraintViolationError | RPCTypeConstraintViolationError | RPCMessageTypeNotSupportedError | RPCFrameworkError;
export {};
