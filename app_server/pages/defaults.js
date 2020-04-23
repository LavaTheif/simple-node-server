/**
 @URL: /defaults
 @param:  N/A

 @response_code 501

 @return    A plaintext error message to be shown to the client.
 */

let page = "<html> <h1>501 -- Method Not Implemented</h1></html>";

exports.eval = function (post) {
    return {responseCode: 501, response: page};
}
