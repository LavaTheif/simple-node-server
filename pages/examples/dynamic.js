//Tells the server that this is a dynamic file
exports.dynamic = true;
/**
 @URL: /examples/dynamic
 @param:  N/A

 @response_code 200

 @return    An example script.
 */

const fs = require("fs");
let template_file = null;
let page = template_file === null?"":fs.readFileSync('./html_templates/' + template_file);

exports.eval = function (post) {
    page = "This was generated dynamically <br>";
    page += "current server time: "+new Date().getTime();
    return {responseCode: 200, response: page};
}