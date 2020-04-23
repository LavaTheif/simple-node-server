//Tells the server that this is a dynamic file
exports.dynamic = true;
/**
 @URL: /examples/dynamic
 @param:  N/A

 @response_code 200

 @return    An example script.
 */

//Only constants go up here
const fs = require("fs");
const template_file = null;

//This function can be async if you need it to be
exports.eval = function (post) {
    // Load a template file
    // let page = template_file === null?"":fs.readFileSync('./html_templates/' + template_file);

    //generate file completely with no template
    //Note: you should really use an XML parser
   //(I just didn't want to add a dependancy for an example)
    let page = "<html>This was generated dynamically <br>";
    page += "current server time: "+new Date().getTime();
    page+="</html>";
 
 //return data should always be in this format.
 //more info on response codes: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
    return {responseCode: 200, response: page};
}
