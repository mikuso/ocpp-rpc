const {RPCServer} = require('../../');

const server = new RPCServer({
    wssOptions: {}, // options passed to WebSocketServer https://www.npmjs.com/package/ws
    pingIntervalMs: 1000*30, // server will attempt to ping all clients at this interval
                             // If no pong is received by the next ping interval, the client is closed with an error
    protocols: ['badproto', 'testproto', 'op'],
    protocolRequired: false,
});

server.auth(async ({remoteAddress, headers, protocol, url}) => {
    // To refuse a client, return a falsey value or throw an Error.
    // If the Error has a 'statusCode' property, it will be used as the return status code for the HTTP response.
    // If the auth passes, the returned value will be stored as the client's 'auth' property in the 'client' event that follows.
    // await new Promise(r => setTimeout(r, 1000));
    return {remoteAddress, headers, protocol, url};
});

server.on('client', (client) => {
    // A client has connected and passed the auth stage.
    // Once this event has fired, RPC calls will begin to be processed in the order they were received,
    // so be sure to set up all your RPC call handlers before returning from here.
        
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
        
        return {dt: (new Date()).toISOString()};
    });

    client.handle('CloseClient', async () => {
        await client.close();
        // while closing, client will reject any additional incoming calls with a ClosingError.
        // once all pending responses have been flushed out, the underlying client socket will close.
        // once the socket has closed, the client will emit a 'close' event.
        // after emitting this event, the returned Promise from client.close() will resolve
    });

    client.handle('CloseServer', async () => {
        await server.close();
        // while closing, no additional clients will be passed to auth()
        // all existing clients will have .close() called on them
        // once all existing clients have emitted the 'close' event, the server will emit a 'close' event
        // after emitting this event, the returned Promise from server.close() will resolve
    });

    client.handle('CallMeBack', async ({params}) => {
        return await client.call(params.method, params.params);
    });

    client.handle(async ({method, params}) => {
        // By not specifying a method name, this handler acts as a wildcard handler which will accept any call.
        // Without a wildcard handler, an unrecognised call would result in an error being returned to the caller.
        console.log('Test server - unexpected call', {method, params});
    });

    client.on('error', err => {
        // if the client experiences an error on the underlying socket or protocol,
        // the error will be passed to this error handler.
        // If no error handler is established, NodeJS may treat the error as an unhandledException.
        // After an error has been emitted, the client will automatically call .close() on itself
        console.log('Test server - client error', err);
    });

    client.on('close', () => {
        // this event fires shortly after client.close() is called, after the underlying socket has closed.
        console.log('Test server - client closed');
    });

});

server.on('error', err => {
    // if the server experiences an error on the underlying socket,
    // the error will be passed to this error handler.
    // If no error handler is established, NodeJS may treat the error as an unhandledException.
    // After an error has been emitted, the server will automatically call .close() on itself
});

(async function() {

    // create a HTTP server listening on this port
    // these are the same options as https://nodejs.org/dist/latest-v17.x/docs/api/net.html#serverlisten
    await server.listen(3000);
    
    // alternatively, listen for an 'upgrade' event from an existing HTTP server
    // httpServer.on('upgrade', server.handleUpgrade);
})();