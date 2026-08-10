---
title: Strict Validation
group: Guides
---
# Strict Validation

RPC clients and servers can operate in "strict mode", validating all calls and responses against
subprotocol JSON schemas. This eliminates the possibility of invalid data structures being
transmitted over RPC.

## Enabling Strict Mode

Pass `strictMode: true` to the `RPCServer` or `RPCClient` constructor:

```js
import { RPCServer } from 'ocpp-rpc';

// Enable strict mode for all subprotocols
const server = new RPCServer({
    protocols: ['ocpp1.6', 'ocpp2.0.1', 'ocpp2.1'],
    strictMode: true,
});
```

You can also limit strict mode to specific protocols:

```js
// Only validate ocpp1.6; allow 'proprietary0.1' without validation
const server = new RPCServer({
    protocols: ['ocpp1.6', 'proprietary0.1'],
    strictMode: ['ocpp1.6'],
});
```

The schema used for validation is determined by whichever subprotocol is agreed between client and server.

## Effects of Strict Mode

**As a caller:**
- If your method or params fail validation, the call rejects immediately with an `RPCError`. The message is never sent.
- If a response to your call fails validation, the call rejects with an `RPCError` and the actual response is discarded.

**As a callee:**
- If an inbound call's params fail validation, the call is not passed to a handler. An appropriate RPC error is automatically returned to the caller.
- If your response to a call fails validation, it is discarded and an `"InternalError"` RPC error is sent instead.

In all cases a `'strictValidationFailure'` event is emitted on the client, detailing the failure.
Always listen for this event so you know when messages are being dropped.

## Built-in Schemas

The following subprotocols are validated out of the box:

| Subprotocol |
|-------------|
| `ocpp1.6`   |
| `ocpp2.0.1` |
| `ocpp2.1`   |

## Adding Custom Schemas

If you want to use `strictMode` with a subprotocol which is not included in the list above, you will need to add the appropriate schemas yourself.
To do this, you must create a `Validator` for each subprotocol and pass them to the RPC constructor using the `strictModeValidators` option.
(It is also possible to override the built-in validators this way.)

To create a Validator, you should pass the name of the subprotocol and a well-formed json schema to `createValidator()`:

```js
import { RPCServer, createValidator } from 'ocpp-rpc';

// Define a validator for a custom 'echo1.0' subprotocol
const echoValidator = createValidator('echo1.0', [
    {
        $schema: "http://json-schema.org/draft-07/schema",
        $id: "urn:ocpp-rpc:Echo.req",
        type: "object",
        properties: { val: { type: "string" } },
        additionalProperties: false,
        required: ["val"]
    },
    {
        $schema: "http://json-schema.org/draft-07/schema",
        $id: "urn:ocpp-rpc:Echo.conf",
        type: "object",
        properties: { val: { type: "string" } },
        additionalProperties: false,
        required: ["val"]
    }
]);

const server = new RPCServer({
    protocols: ['echo1.0'],
    strictModeValidators: [echoValidator],
    strictMode: true,
});

client.handle('Echo', async ({params}) => {
    return params; // return the input back to the caller
});

// await client.call('Echo', {val: 'foo'}); // returns {val: 'foo'}
// await client.call('Echo', ['bar']);      // throws RPCError (array is invalid)
```

Once created, a `Validator` instance is immutable and can be reused across multiple servers or clients.
