---
title: Upgrading previous versions
group: Guides
---
# Upgrading

## From 2.X to 3.0

Breaking changes:
* This module now requires Nodejs >= 20.
* This module now uses ESM instead of the CJS module system. (This should not affect your project if you are using Nodejs >= 20.19.0).
* Custom schemas made for version 2.X no longer work for 3.0.0. The urn of each JSON Schema `$id` now requires an nid component (as per spec, and enforced by Ajv >= 8.16). This has always been a requirement that was ignored by ocpp-rpc previously. See examples of working schema urns in `schemas/test/` and refer to the new options for [`createValidator()`](../functions/createValidator.html) to specify the nid you wish to use. If you are only using the standard built-in OCPP schemas/validators, then these changes will not affect you.
* The 4 websocket connection states (`CONNECTING`, `OPEN`, `CLOSING`, and `CLOSED`) are no longer properties of `RPCClient`. Instead, they are exposed under the `ConnectionState` enum object. (e.g. `ConnectionState.OPEN`). You can import them using `import { ConnectionState } from 'ocpp-rpc';`
* Messages received with an unknown message type ID are now dropped/ignored in line with the removal of the 'Extension fallback mechanism' from OCPP-J specs. Previously, they would trigger the `'badMessage'` event. Instead you can either listen for the `'message'` event, or the new `'messageHandlingError'` event.
* There have been various changes to events emitted by `RPCClient`:
    * `RPCClient` now emits an `'error'` event to expose low-level errors which are not directly related to the handling of OCPP messages. You should listen for these, or else they will be logged to the console instead.
    * The `'socketError'` event has been deprecated and will be removed in a future version. These socket errors are now available through the new `'error'` event instead.
    * The `'response'` event has been deprecated and will be removed in a future version. Prefer to listen to the `'callResult'`, `'callError'` and `'callResultError'` events instead.
    * The `'call'`, `'callError'` and `'callResult'` events now include some new properties.
    * The `'send'` and `'callResultError'` events have been added to support the new message types added in OCPP 2.1.
    * The `'strictValidationFailure'` event signature has changed, replacing the property `boolean: isCall` with an enum `MessageType: typeId`
    * The `'messageHandlingError'` event has been added, alerting as to when a call handler has thrown an uncaught error, or when the message processor was unable to process an incoming message due to it having an unknown message type ID.
* OCPP1.6 deprecated error messages now use the same class as their corrected counterparts (rather than being their own distinct class). See the [guide to error handling](./error-handling.md) for more information about these changes.
* Fixed an error where `RPCOccurenceConstraintViolation` and `RPCOccurrenceConstraintViolation` errors were switched.

## From 1.X to 2.0

Breaking changes:
* The `RPCClient` event [`'strictValidationFailure'`](../classes/RPCClient.html#strictvalidationfailure) now fires for both inbound & outbound requests & responses.
* The `RPCClient` event [`'strictValidationFailure'`](../classes/RPCClient.html#strictvalidationfailure) emits an object containing more information than was previously available. The Error which was previously emitted is now a member of this object.
* The `password` option in the [`RPCClient` constructor](../classes/RPCClient.html) can now be supplied as a `Buffer`. If a string is provided, it will be encoded as utf8.
* The `password` field of [`RPCServerClient`'s `handshake`](../classes/RPCServerClient.html#handshake) object is now always provided as a Buffer instead of a string. Use `password.toString('utf8')` to convert back to a string as per previous versions.
