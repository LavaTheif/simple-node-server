/**
 @URL: /API/defaults
 @param:  N/A

 @response_code 501

 @return    A plaintext error message to be shown to the client.
 */

exports.eval = function (post) {
    return {responseCode: 501, response: "Method not implemented."};
}
