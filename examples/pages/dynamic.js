//Tells the server that this is a dynamic file
exports.dynamic = true;
//This is where the config will be loaded. It is not required to be here
exports.config = {};
/**
 @URL: /dynamic
 @param:  N/A

 @response_code 200

 @return    An example script.
 */

const fs = require("fs");
let template_file = null;

exports.eval = function (post) {
    // Load a template file
    // let page = template_file === null?"":fs.readFileSync('./html_templates/' + template_file);

    //generate file completely
    let page = "<html>This was generated dynamically <br>";
    page += "current server time: "+new Date().getTime();
    page+="</html>";
    return {responseCode: 200, response: page};
}