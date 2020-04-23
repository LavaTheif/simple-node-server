/**
 @URL: /API/login
 @param username -- the users username or email
 @param password -- the users password
 @param hwids -- a list of hardware IDs and names

 @response_code 200 -- Data Validated
 401 -- Invalid username, password or hardware IDs

 @return success:
 A JSON string containing authentication credentials.
 error:
 A plaintext error message to be shown to the client.
 */

exports.eval = function (post) {
    return {responseCode: 501, response: "Method not implemented."};
}