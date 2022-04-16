const {RPCClient} = require('../../');

let bo;
try {
    const backoff = require('backoff');
    bo = backoff.fibonacci({
        randomisationFactor: 0,
        initialDelay: 100,
        maxDelay: 3000
    });
    bo.failAfter(10);
} catch (err) {}

const client = new RPCClient({
    reconnect: true, // if true, client will attempt to reconnect after connection failure
    backoff: bo,  // a Backoff instance, created by https://www.npmjs.com/package/backoff
                    // used to automatically reconnect.
    callTimeoutMs: 30*1000, // milliseconds before a call will be cancelled with a timeout error if no response is received
    wsOptions: {}, // options object passed to WebSocket https://www.npmjs.com/package/ws
    pingIntervalMs: 1000*30, // client will attempt to ping the server at this interval
                             // If no pong is received by the next ping interval, the client is closed with an error
    url: 'ws://localhost:3000/test/with?params=true&a=123',
    protocols: ['testproto', 'op'],
});

client.handle('Echo', async ({method, params}) => {
    // 'method' is the name of the call (in this case, 'Heartbeat')
    // 'params' is the content/body of the call
    // the return value will be passed as a response to the call.
    // if the return value is a Promise, it will wait to be resolved first.
    // if the Promise rejects or an Error is thrown from here, an error will be sent back as a reply to the RPC client instead.

    return params;
});

client.handle('Heartbeat', async ({method, params}) => {
    // 'method' is the name of the call (in this case, 'Heartbeat')
    // 'params' is the content/body of the call
    // the return value will be passed as a response to the call.
    // if the return value is a Promise, it will wait to be resolved first.
    // if the Promise rejects or an Error is thrown from here, an error will be sent back as a reply to the RPC client instead.

    return new Date().toDateString();
});

client.handle('CloseClient', async () => {
    await client.close();
    // while closing, client will reject any additional incoming calls with a ClosingError.
    // once all pending responses have been flushed out, the underlying client socket will close.
    // once the socket has closed, the client will emit a 'close' event.
    // after emitting this event, the returned Promise from client.close() will resolve
});

client.handle('CallMeBack', async ({params}) => {
    return await client.call(params.method, params.params);
});

client.handle(async ({method, params}) => {
    // By not specifying a method name, this handler acts as a wildcard handler which will accept any call.
    // Without a wildcard handler, an unrecognised call would result in an error being returned to the caller.
});

client.on('error', err => {
    // if the client experiences an error on the underlying socket or protocol,
    // the error will be passed to this error handler.
    // If no error handler is established, NodeJS may treat the error as an unhandledException.
    // After an error has been emitted, the client will automatically call .close() on itself
});

client.on('connect', async () => {
    // this event fires after the socket connection is established (or re-established)
    
});

client.on('reconnect', () => {
    // this event fires after the socket has reconnected after a failed connection
});

client.on('disconnect', () => {
    // this event fires after the socket connection has failed
});

client.on('close', () => {
    // This event fires shortly after client.close() is called, after the underlying socket has disconnected.
    // It is not possible to re-open a closed client.
});


(async function() {

    try {
        client.on('open', (...args) => console.log('#### open', args));
        client.on('close', (...args) => console.log('#### close', args));
        client.on('connecting', (...args) => console.log('#### connecting', args));
        client.on('closing', (...args) => console.log('#### closing', args));
        client.on('error', (...args) => console.log('#### error', args));


        await client.connect();
        const time = await client.call('Heartbeat', {});
        console.log('Server time is:', time);
        console.log('A =', await client.call('Echo', 'A'));
        await client.close({code: 1001, awaitPendingResponses: true});
        console.log('Closed');
    
        await client.close();

    } catch (err) {
        console.log('test error:', err);
    }

})();