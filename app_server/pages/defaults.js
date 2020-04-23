exports.dynamic = true;
/**
 @URL: /defaults
 @param:  N/A

 @response_code 501

 @return    A plaintext error message to be shown to the client.
 */

const fs = require("fs");
let file = null;
let page = file === null?"<html> <h1>501 -- Method Not Implemented</h1></html>":fs.readFileSync('../html_templates/'+file);

exports.eval = function (post) {
    return {responseCode: 501, response: page};
}
