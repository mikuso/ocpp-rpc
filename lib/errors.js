
export class TimeoutError extends Error {

};

export class UnexpectedHttpResponse extends Error {

    /**
     * An error which occurs when a Websocket HTTP upgrade fails due to receiving an unexpected response from the server.
     * 
     * @param {string | undefined} message
     * @param {object} obj
     * @param {number} [obj.code]
     * @param {import('node:http').ClientRequest} obj.request
     * @param {import('node:http').IncomingMessage} obj.response
     */
    constructor(message, {code, request, response}) {
        super(message);

        /** @type {number | undefined} */
        this.code = code;

        /** @type {import('node:http').ClientRequest} */
        this.request = request;

        /** @type {import('node:http').IncomingMessage} */
        this.response = response;
    }
};

export class RPCError extends Error {
    /** @const */
    rpcErrorMessage = '';
    /** @const */
    rpcErrorCode = 'GenericError';
}

export class RPCGenericError extends RPCError {
    /** @const */
    rpcErrorMessage = '';
    /** @const */
    rpcErrorCode = 'GenericError';
}

export class RPCNotImplementedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Requested method is not known';
    /** @const */
    rpcErrorCode = 'NotImplemented';
}

export class RPCNotSupportedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Requested method is recognised but not supported';
    /** @const */
    rpcErrorCode = 'NotSupported';
}

export class RPCInternalError extends RPCError {
    /** @const */
    rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    /** @const */
    rpcErrorCode = 'InternalError';
}

export class RPCProtocolError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for method is incomplete';
    /** @const */
    rpcErrorCode = 'ProtocolError';
}

export class RPCSecurityError extends RPCError {
    /** @const */
    rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    /** @const */
    rpcErrorCode = 'SecurityError';
}

export class RPCFormatViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    /** @const */
    rpcErrorCode = 'FormatViolation';
}

export class RPCFormationViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    /** @const */
    rpcErrorCode = 'FormationViolation';
}

export class RPCPropertyConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
    /** @const */
    rpcErrorCode = 'PropertyConstraintViolation';
}

export class RPCOccurenceConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    /** @const */
    rpcErrorCode = 'OccurenceConstraintViolation';
}

export class RPCOccurrenceConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    /** @const */
    rpcErrorCode = 'OccurrenceConstraintViolation';
}

export class RPCTypeConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    /** @const */
    rpcErrorCode = 'TypeConstraintViolation';
}

export class RPCMessageTypeNotSupportedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
    /** @const */
    rpcErrorCode = 'MessageTypeNotSupported';
}

export class RPCFrameworkError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
    /** @const */
    rpcErrorCode = 'RpcFrameworkError';
}

export class WebsocketUpgradeError extends Error {
    /**
     * 
     * @param {number} code 
     * @param {string} [message] 
     */
    constructor(code, message) {
        super(message);

        /** @type {number} */
        this.code = code;
    }
}
