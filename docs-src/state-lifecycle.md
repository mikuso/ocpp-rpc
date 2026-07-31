---
title: RPCClient State Lifecycle
group: Guides
---
# RPCClient State Lifecycle

![RPCClient state lifecycle](../assets/statelifecycle.png)

**CLOSED**
* RPC calls while in this state are rejected.
* RPC responses will be silently dropped.

**CONNECTING**
* RPC calls & responses while in this state will be queued.

**OPEN**
* Previously queued messages are sent to the server upon entering this state.
* RPC calls & responses now flow freely.

**CLOSING**
* RPC calls while in this state are rejected.
* RPC responses will be silently dropped.
