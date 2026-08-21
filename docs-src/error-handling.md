---
title: Error Handling
group: Guides
---
# Error Handling

## A brief overview of the protocol

At the protocol level, there are currently two ways that errors are transmitted through OCPP:
- Via a `CALLERROR`, in resonse to a `CALL`
- Via a `CALLRESULTERROR`, in response to a `CALLRESULT` (`CALLRESULTERROR` is a new message introduced in OCPP 2.1)

Each of these messages must contain an error code which signals the type of error being transmitted. The error code must be one of the following:

| ErrorCode | Description |
| --------- | ----------- |
| FormatViolation | Payload for Action is syntactically incorrect |
| GenericError | Any other error not covered by the more specific error codes in this table |
| InternalError | An internal error occurred and the receiver was not able to process the requested Action successfully |
| MessageTypeNotSupported | A message with an Message Type Number received that is not supported by this implementation. |
| NotImplemented | Requested Action is not known by receiver |
| NotSupported | Requested Action is recognized but not supported by the receiver |
| OccurrenceConstraintViolation | Payload for Action is syntactically correct but at least one of the fields violates occurrence constraints |
| PropertyConstraintViolation | Payload is syntactically correct but at least one field contains an invalid value |
| ProtocolError | Payload for Action is not conform the PDU structure |
| RpcFrameworkError | Content of the call is not a valid RPC Request, for example: MessageId could not be read. |
| SecurityError | During the processing of Action a security issue occurred preventing receiver from completing the Action successfully |
| TypeConstraintViolation | Payload for Action is syntactically correct but at least one of the fields violates data type constraints (e.g. "somestring": 12) |

## How ocpp-rpc uses OCPP error codes

In this module, all of these errors are implemented as subclasses of `RPCError`, with class names such as `RPCNotImplementedError`, `RPCInternalError` and `RPCFrameworkError`. A full list of these `RPCError` subclasses can be found in this documentation.

### Sending errors

Sending OCPP errors via ocpp-rpc is largely automatic. For example:

- If the remote party tries to call a method for which you do not have a handler registered, then ocpp-rpc silently responds with a `CALLERROR` containing a `NotImplemented` error code.
- If the remote party tries to make a call but the message doesn't conform to OCPP-J spec, then ocpp-rpc responds with a `CALLERROR` containing a `RpcFrameworkError` error code.
- If the remote party tries to make a call with parameters which violate a specific protocol schema, and [strict mode](./strict-validation.md) is enabled, then ocpp-rpc responds with a `CALLERROR` and an appropriate error code depending on the violation.
- If the remote party returns an invalid call result which violates a specific protocol schema, and [strict mode](./strict-validation.md) is enabled, and the connection is not using an OCPP version older than OCPP 2.1, then ocpp-rpc silently sends a `CALLRESULTERROR` with an appropriate error code depending on the violation.
- If the remote party makes a successful call to your handler, but your handler throws an error, then:
    - If the thrown error is not a subclass of `RPCError`, it will send a `CALLERROR` containing an `InternalError` error code.
    - If the thrown error *is* a subclass of `RPCError`, it will send a `CALLERROR` containing the error code corresponding to the thrown error.
    - In both cases, the error message accompanying it will reflect that of the error thrown.
    - If the client/server uses the `respondWithDetailedErrors` option, then the `CALLERROR` details will be populated with a stack trace and other properties of the error. (Note: This is not enabled by default)

If you wish to deliberately return a `CALLERROR` with a specific OCPP error from one of your handlers, then it's [strongly advised](#backwards-compatibility-with-ocpp-16) to create the error using the `createRPCError()` function, and then throw it, like so:

```js
import { createRPCError } from 'ocpp-rpc';

client.handle('UpdateFirmware', async () => {
    throw createRPCError("NotSupported", "Firmware cannot be updated on this device");
});
```

> [!NOTE]
> Currently there is no way to manually send a `CALLRESULTERROR`. This will be addressed in a future version of ocpp-rpc.

### Receiving/handling errors

#### `CALLERROR`

You will encounter these errors when your `call()`s throw/reject.

Behind the scenes, ocpp-rpc takes incoming OCPP `CALLERROR` messages and maps them back to their originating OCPP `CALL` message. The error code from the `CALLERROR` is mapped to an ocpp-rpc `RPCError` type and then thrown/rejected back to the caller.

In simple terms, if the remote party returns a `NotSupported` error code in response to your `client.call(...)`, then the call will throw an `RPCNotSupported` error instead of returning a result.

The best way to handle these errors is to use a try/catch block, like in the following example:

```js
try {
    // We expect this call will throw...
    await client.call('AMethodThatDoesntExist', {});
} catch (err) {
    if (err instanceof RPCNotImplementedError) {
        // handle this specific error case
    }

    if (err instanceof RPCError) {
        // or, the more general RPC error case
    }
}
```

#### `CALLRESULTERROR`

Handling `CALLRESULTERROR`s requires a different strategy. Since `CALLRESULTERROR`s don't fit into a stadard call/response flow (and they are hard to predict if/when they will arrive), we must instead listen for a `'callResultError'` event which will contain the error details, like so:

```js
client.on('callResultError', ({messageId, error}) => {
    console.error(`[${messageId}] CALLRESULTERROR: ${error.rpcErrorCode} - ${error.message}`);
});
```

## Backwards compatibility with OCPP 1.6

OCPP 1.6 was the first of the OCPP protocols to introduce the OCPP-J (JSON over WebSocket) RPC framework.

In this original version, there were a couple of mistakes in the naming of some error codes:

- `FormatViolation` was originally called `FormationViolation`
- `OccurrenceConstraintViolation` was originally called `OccurenceConstraintViolation` (note the missing "r").

An errata document was released by the OCA to recognise these mistakes, but implementers were advised not to fix them, as doing so may break compatibility with some systems.

As a result, ocpp-rpc enables a hidden feature flag when using OCPP 1.6 (or older), which automatically translates the error codes to/from their deprecated spellings as appropriate, but also allows you to create and handle error messages using whichever spelling you prefer. For example:

### Sending OCPP 1.6 deprecated errors

```js
client.handle('Test', async () => {
    // Both of these next 2 lines will instantiate & throw an instance of the same error class
    throw createRPCError("FormatViolation");
    throw createRPCError("FormationViolation");

    // i.e. these are equivalent:
    (createRPCError("FormatViolation")    instanceof RPCFormatViolationError) // true
    (createRPCError("FormationViolation") instanceof RPCFormatViolationError) // true

    // Regardless of whether the error was created using the new name ("FormatViolation") or the deprecated name ("FormationViolation"), ocpp-rpc will feature-detect which is the appropriate OCPP error code to send over the wire to the other party.
    // In the case of OCPP 1.6 or earlier, it will send "FormationViolation".
    // In any other case, it will send "FormatViolation"
});
```

### Handling OCPP 1.6 deprecated errors

```js
try {
    // Suppose the following call resulted in a format violation error...
    await client.call("Test", {});
} catch (err) {
    // If the client is communicating via OCPP 1.6 or earlier, then the CALLERROR message is expected to contain the error code "FormationViolation"
    // Otherwise, the error code should be "FormatViolation" instead.

    // However, regardless of what actual error code was sent over the wire, `err` will (in either case) be an instance of RPCFormatViolationError.

    (err instanceof RPCFormatViolationError) // true

    // Additionally, since RPCFormationViolationError is just an alias of RPCFormatViolationError, then this is also simultaneously true:

    (err instanceof RPCFormationViolationError) // true

    // If you actually *need* to know which error code was used over the wire, then you can consult the rpcErrorCode property:

    console.log(err.rpcErrorCode); // either "FormatViolation" or "FormationViolation" depending on what error code was sent over the wire.
}
```
