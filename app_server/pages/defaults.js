exports.dynamic = true;
/**
 @URL: /defaults
 @param:  N/A

 @response_code 501

 @return    A plaintext error message to be shown to the client.
 */

const fs = require("fs");
let template_file = null;

exports.eval = function (post) {
    let page = template_file === null?"<html> <h1>501 -- Method Not Implemented</h1></html>":fs.readFileSync('../html_templates/'+file);
    return {responseCode: 501, response: page};
}
