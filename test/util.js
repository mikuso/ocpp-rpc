const assert = require('assert');
const { createRPCError } = require("../lib/util");
const errors = require('../lib/errors');

describe('util', function(){

    describe('createRPCError', function(){

        it('should create errors according to their type', () => {

            assert.ok(createRPCError('GenericError') instanceof errors.RPCGenericError);
            assert.ok(createRPCError('NotImplemented') instanceof errors.RPCNotImplementedError);
            assert.ok(createRPCError('NotSupported') instanceof errors.RPCNotSupportedError);
            assert.ok(createRPCError('InternalError') instanceof errors.RPCInternalError);
            assert.ok(createRPCError('ProtocolError') instanceof errors.RPCProtocolError);
            assert.ok(createRPCError('SecurityError') instanceof errors.RPCSecurityError);
            assert.ok(createRPCError('FormationViolation') instanceof errors.RPCFormationViolationError);
            assert.ok(createRPCError('PropertyConstraintViolation') instanceof errors.RPCPropertyConstraintViolationError);
            assert.ok(createRPCError('OccurenceConstraintViolation') instanceof errors.RPCOccurenceConstraintViolationError);
            assert.ok(createRPCError('TypeConstraintViolation') instanceof errors.RPCTypeConstraintViolationError);
            assert.ok(createRPCError('MessageTypeNotSupported') instanceof errors.RPCMessageTypeNotSupportedError);
            assert.ok(createRPCError('RpcFrameworkError') instanceof errors.RPCFrameworkError);

        });

    });

});