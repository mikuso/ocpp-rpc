
describe('RPCServer', function(){

    // this.beforeEach(async function(){

    //     this.httpServer = await server.listen(0);
    //     this.port = this.httpServer.address().port;
    // });


    describe('events', function(){

        it('should emit "client" when client connects', async () => {

        });

    });

    // should close connections when receiving malformed messages
    // should not allow new connections after close (before http close)
    // should attach to an existing http server
    // should allow creating multiple http servers via listen() and close() only affects those closed?
    // should attach auth and request properties to client
    // should disconnect client if auth failed
    // should regularly ping clients
    // should disconnect client with code 1002 if protocol required but not provided

});