---
title: Upgrading previous versions
group: Guides
---
# Upgrading

## From 2.X to 3.0

Breaking changes:
* Custom schemas made for version 2.X no longer work for 3.0.0. The urn of each JSON Schema `$id` now requires an nid component (as per spec, and enforced by Ajv >= 8.16). This has always been a requirement that was ignored by ocpp-rpc. See examples of working schema urns in `schemas/test/` and refer to the new options for [`createValidator()`](../functions/createValidator.html) to specify the nid you wish to use.

## From 1.X to 2.0

Breaking changes:
* The `RPCClient` event [`'strictValidationFailure'`](../classes/RPCClient.html#strictvalidationfailure) now fires for both inbound & outbound requests & responses.
* The `RPCClient` event [`'strictValidationFailure'`](../classes/RPCClient.html#strictvalidationfailure) emits an object containing more information than was previously available. The Error which was previously emitted is now a member of this object.
* The `password` option in the [`RPCClient` constructor](../classes/RPCClient.html) can now be supplied as a `Buffer`. If a string is provided, it will be encoded as utf8.
* The `password` field of [`RPCServerClient`'s `handshake`](../classes/RPCServerClient.html#handshake) object is now always provided as a Buffer instead of a string. Use `password.toString('utf8')` to convert back to a string as per previous versions.
