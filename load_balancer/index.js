//global functions
let consoleUtils = require("../utils/console_log.js");

//initialises the console utils
let ENV = require("../conf/ENV.json");
ENV = ENV?ENV.env : "PROD";
consoleUtils.init(ENV);

//Storage for online servers
let server_pool_sockets = {};
let server_pool_ids = [];

//timeout for connections
const TIMEOUT = ENV === "DEV" ? 10000 : 1500;

//Upstream server port to connect to
const UPSTREAM_PORT = 8080;

//TODO: This isn't needed now, but if I ever need to access the database from this, then create a utils file to load it.
//(so I dont just copy paste the src to this file from the app server

//TODO: SSL
var http = require('http');

/** Programmers notes to self:
 *
 *
 As web servers are well suited for static content and app servers for dynamic content, most of the production environments have web server acting asreverse proxy to
 app server.That means while servicing a page request, static contents (such as images/Static HTML) are served by web server that interprets the request. Using some kind of
 filtering technique (mostly extension of requested resource) web server identifies dynamic content request and transparently forwards to app server
 * ^^^^^^^^^^^^^
 * Do that to serve static things (aka file downloads for the cheats)
 *
 * If the service becomes massively popular (I'm talking huge here, so very unlikely beause aqua is estimating only 1k users) you could direct each/similar routes to a separate server from the rest
 * such as the /api/login and any other authentication requests could likely be sent to a server dedicated for authentication
 *
 * If you need to, you could set up more proxies, such as maybe an SQL proxy which distributes requests across an SQL cluster
 *
 *
 * TODO: Rate limiting and enable/disable maintainance
 *
 */

//Select servers using round robin algorithm (sequentially)
let currentServer = -1;

//handle requests
function onRequest(client_req, client_res) {
    //TODO: 429 -- too many requests
    //TODO: 503 -- maintainance

    console.debug('serve: ' + client_req.url);

    currentServer++;
    if(server_pool_ids.length === 0){
        client_res.writeHead(504);
        return client_res.end("Timmed out or otherwise could not connect to upstream server.");
    }else if(currentServer >= server_pool_ids.length){
        currentServer = 0;
    }else if(currentServer < 0){
        currentServer = 0;
    }

    console.debug("server index: " + currentServer);

    var options = {
        hostname: Object.keys(server_pool_sockets)[currentServer],
        port: UPSTREAM_PORT,
        path: client_req.url,
        method: client_req.method,
        headers: client_req.headers
    };

    var proxy = http.request(options, function (res) {
        client_res.writeHead(res.statusCode, res.headers)
        res.pipe(client_res, {
            end: true
        });
    });

    proxy.on('error', function(err) {
        console.err(err);
        // Handle error
        client_res.writeHead(502);
        return client_res.end("Bad Gateway. Invalid response from upstream server.");
    });

    client_req.pipe(proxy, {
        end: true
    });
}

//set up listener
http.createServer(onRequest).listen(443);
console.log("Setup proxy on port 443");

//TODO: move this to a utils file
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

//socket and crypto dependencies
const net = require('net');
const crypto = require('crypto');
const fs = require('fs');

// Create a server object
const server = net.createServer((socket) => {
    setTimeout(
        function(){
            let address = socket.remoteAddress;
            if(!server_pool_sockets[address]){
                console.debug("No Data Sent.");
                socket.end();
            }
        }, TIMEOUT);

    //recieve data
    socket.on('data', (data) => {
        // console.log(1);
        if(server_pool_sockets[socket.remoteAddress]){
            //already initialised, its just sending more data
        } else {
            //parse the recieved data
            let json;
            try {
                json = JSON.parse(data.toString());
            }catch(err){
                //Invalid data sent
                return socket.end();
            }

            //extract id (and end socket if data is malformed)
            let id = json["id"];
            if(!id)
                return socket.end();

            //get that servers public key
            //we read this every connection with fs so we can update it without restarting this handler
            let allowed_svrs = JSON.parse(fs.readFileSync("../conf/allowed_servers.json"));
            let pub = allowed_svrs[id];

            //unknown server
            if(!pub)
                return socket.end();

            //verify the data that the client sent against its public key
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(json["dat"]);
            let valid = verify.verify(pub, json["auth"], 'base64');

            //get the current and generated time of the data
            let now = new Date().getTime();
            let generated = JSON.parse(json["dat"]).timestamp;


            if (valid && now - generated < TIMEOUT && !server_pool_ids.includes(id)) {
                //Signature valid, and timestamp within the timeout limit and server not already connected
                //push the id etc to the server pool
                server_pool_ids.push(id);
                server_pool_sockets[socket.remoteAddress] = {id: id, socket: socket};
                socket.write("y");
            } else {
                //something was invalid, kill the connection
                socket.end();
            }
            console.debug({server_pool_ids, server_pool_sockets});
        }
    });

    socket.on('close', (data) => {
        // console.debug(0)
        //remove the server from the server pool
        let address = socket.remoteAddress;
        if(!server_pool_sockets[address])
            return;
        let id = server_pool_sockets[address].id;
        server_pool_ids.remove(id);
        delete server_pool_sockets[address];
    });

    socket.on('end', (data) => {
    });

    socket.on('error', (data) => {
        console.err(data);
        //something like the connection was killed
    });

}).on('error', (err) => {
    console.err(err);
});

//start listening
server.listen(8443, () => {
    console.log('running server pool listener on port 8443');
});
