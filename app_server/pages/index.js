exports.dynamic = true;
/**
 @URL: /
 @param:  N/A

 @response_code 200

 @return    Home Page to be shown to the client.
 */

const fs = require("fs");
let template_file = "index.html";

exports.eval = function (req) {
    let page = fs.readFileSync('./html_templates/' + template_file);
    page += "This timestamp is generated dynamically: "+new Date().getTime();

    return {responseCode: 200, response: page};
}
