import { ok, equal } from 'assert';
import { createRPCError, getErrorPlainObject } from "../lib/util.js";
import { RPCGenericError, RPCNotImplementedError, RPCNotSupportedError, RPCInternalError, RPCProtocolError, RPCSecurityError, RPCFormationViolationError, RPCFormatViolationError, RPCPropertyConstraintViolationError, RPCOccurenceConstraintViolationError, RPCOccurrenceConstraintViolationError, RPCTypeConstraintViolationError, RPCMessageTypeNotSupportedError, RPCFrameworkError } from '../lib/errors.js';

describe('util', function(){

    describe('createRPCError', function(){

        it('should create errors according to their type', () => {

            ok(createRPCError('GenericError') instanceof RPCGenericError);
            ok(createRPCError('NotImplemented') instanceof RPCNotImplementedError);
            ok(createRPCError('NotSupported') instanceof RPCNotSupportedError);
            ok(createRPCError('InternalError') instanceof RPCInternalError);
            ok(createRPCError('ProtocolError') instanceof RPCProtocolError);
            ok(createRPCError('SecurityError') instanceof RPCSecurityError);
            ok(createRPCError('FormationViolation') instanceof RPCFormationViolationError);
            ok(createRPCError('FormatViolation') instanceof RPCFormatViolationError);
            ok(createRPCError('PropertyConstraintViolation') instanceof RPCPropertyConstraintViolationError);
            ok(createRPCError('OccurenceConstraintViolation') instanceof RPCOccurenceConstraintViolationError);
            ok(createRPCError('OccurrenceConstraintViolation') instanceof RPCOccurrenceConstraintViolationError);
            ok(createRPCError('TypeConstraintViolation') instanceof RPCTypeConstraintViolationError);
            ok(createRPCError('MessageTypeNotSupported') instanceof RPCMessageTypeNotSupportedError);
            ok(createRPCError('RpcFrameworkError') instanceof RPCFrameworkError);

        });

        it('should create generic error if code not found', () => {

            ok(createRPCError('_NOTFOUND_') instanceof RPCGenericError);

        });

    });

    describe('getErrorPlainObject', function(){

        it('should fallback to simple error object if json stringification fails', () => {

            const msg = "TEST";
            const err = Error(msg);
            err.nested = err;
            const plain = getErrorPlainObject(err);
            
            ok(plain);
            ok(plain instanceof Object);
            ok(!(plain instanceof Error));
            equal(plain.message, msg);

        });

    });

});