# OCPP-RPC

[![Coverage Status](https://coveralls.io/repos/github/mikuso/ocpp-rpc/badge.svg?branch=master)](https://coveralls.io/github/mikuso/ocpp-rpc?branch=master)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/mikuso/ocpp-rpc/test.yaml?branch=master)
[![GitHub issues](https://img.shields.io/github/issues/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/issues)
[![GitHub license](https://img.shields.io/github/license/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/blob/master/LICENSE.md)
[![GitHub stars](https://img.shields.io/github/stars/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/network)

![OCPP-RPC](./assets/logo.png)

A client & server implementation of the WAMP-like RPC-over-websocket system defined in the [OCPP-J protocols](https://openchargealliance.org/protocols/) (e.g. [OCPP1.6J](https://openchargealliance.org/protocols/open-charge-point-protocol/#OCPP1.6), [OCPP2.0.1J](https://openchargealliance.org/protocols/open-charge-point-protocol/#OCPP2.0.1) and [OCPP2.1](https://openchargealliance.org/protocols/open-charge-point-protocol/#OCPP2.1)).

Requires Node.js >= 20

This module is built for Node.js and does not currently work in browsers.

## Who is this for?

* Anyone building an OCPP-based Charging Station or Charging Station Management System (CSMS) using Node.js.
* Anyone looking for a simple yet robust symmetrical RPC framework that runs over WebSockets.

## Features

* 🛂 **Authentication** - Optional authentication step for initiating session data and filtering incoming clients.
* 🔒 **[OCPP Security](#ocpp-security)** - Compatible with OCPP security profiles 1, 2 & 3.
* 💬 **Serve multiple subprotocols** - Simultaneously serve multiple different subprotocols from the same service endpoint.
* ✅ **[Strict Validation](#strict-validation)** - Optionally enforce subprotocol schemas to prevent invalid calls & responses.
* **Automatic reconnects** - Client supports automatic exponential-backoff reconnects.
* **Automatic keep-alive** - Regularly performs pings, and drops dangling TCP connections.
* **Graceful shutdowns** - Supports waiting for all in-flight messages to be responded to before closing sockets.
* **Clean closing of websockets** - Supports sending & receiving WebSocket close codes & reasons.
* **Embraces abort signals** - `AbortSignal`s can be passed to most async methods.
* **Optional HTTP server** - Bring your own HTTP server if you want to, or let `RPCServer` create one for you.

## Installing

```sh
npm install ocpp-rpc
```

## Usage Examples

See the **[Getting Started](https://mikuso.github.io/ocpp-rpc/Getting_Started.html)** guide in the API docs.

## API Docs

Full **[API documentation and guides](https://mikuso.github.io/ocpp-rpc/)** are available.

## Licenses

- **ocpp-rpc:** Licensed under the [MIT License](./LICENSE.md)
- **OCPP schemas:** Licensed from the Open Charge Alliance under [Creative Commons Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)](./schemas/openchargealliance/LICENSE.md).
