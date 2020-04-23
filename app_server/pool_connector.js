//require dependencies
const crypto = require('crypto');
const net = require('net');
let address = "localhost";

function getData(){
    //create instance of sign
    const sign = crypto.createSign('RSA-SHA256');

    //get our data
    let keyDat = require("../conf/privateKey.json");

    //extract the server id and private key
    let id = Object.keys(keyDat)[0];
    let privateKey = keyDat[id];

    //generate the text we need
    let text = JSON.stringify({timestamp: new Date().getTime(), dat: Math.floor(Math.random()*2147483647)});

    //Sign the data with our private key
    sign.update(text);
    let signed = sign.sign(privateKey, 'base64');

    //for testing purposes.
    // for(let i = 0; i < 2147483647; i++){}

    //put data together into JSON
    let dataToSend = {id: id, auth: signed, dat: text};
    return JSON.stringify(dataToSend);
}

function connect() {
    // create a socket to the load_balancer
    const client = net.createConnection({host: address, port: 8443}, () => {
        //when the socket is opened, send the data
        console.log("Connecting to the server pool...");
        client.write(getData());
    });

    //
    client.on('data', (data) => {
        if(data.toString() === "y"){
            console.log("Connected to server pool.");
        }
    });

    client.on('error', (data) => {
        console.err(data.toString());
    });

    client.on('close', () => {
        console.log('disconnected from server pool, reconnecting...');
        connect();
    });
}

exports.init = function (app_svr) {
    address = app_svr.config.load_balancer;
    connect();
}