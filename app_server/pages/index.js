exports.dynamic = true;
/**
 @URL: /
 @param:  N/A

 @response_code 200

 @return    Home Page to be shown to the client.
 */

const fs = require("fs");
let file = "index.html";
let page = fs.readFileSync('./html_templates/' + file);

exports.eval = function (post) {
    page += "This timestamp is generated dynamically: "+new Date().getTime();

    return {responseCode: 200, response: page};
}
