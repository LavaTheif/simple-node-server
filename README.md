# simple-node-server
A simple app server and load balancing proxy server template created in Node JS.

It allows for you to easily create new pages and API routes.

## App Server Setup

### Runtime options
Execute `node . help` in the appserver directory, or run with the following options:

```
--new-conf      |       generates a new environment config file (based on defaults.json)
--quiet-upd     |       if the config is missing elements, import the new ones from the defaults and suppress warnings
--conf=name     |       run using a specific config file rather than the environment config
--env=env       |       set the environment from the command line and override the ENV file
--no-load       |       Don't use the load balancer (intended for development purposes)
--refresh       |       Reloads the pages every second (intended for development purposes)


Note: --new-conf will generate a default config and terminate the process. To continue execution, use --quiet-upd
```

#### ../conf/
In the root directory, create a new folder call `conf`. This is where you should put all your configs private files that will not get committed.


To start with, create an environment file `ENV.json` with the attribute `env` set to your current environment (likely "DEV").


Next, you need to create a `defaults.json` file. This will be the default config template. You can put what you want in this file as it is passed into the server_utils file, however you must include `"load_balancer": "localhost"` so that the server knows where to connect to the load balancer.


When you first run the server, it will generate 2 key files and terminate. These will also be in the same directory and are explained in the load balancer setup below.


After these files are generated, the server will attempt to load the environment config file (eg if env=DEV, it will load DEV.json). You can use --new-conf to automatically generate from the defaults.json file.


> note: if you ever update defaults.json, it will automatically update the current environment config to include the new values (use --quiet-upd to update the file silently)


### API routes
API routes are designed to handle POST requests and return a response to the client.
Go into the /routes/ and create a route.js file. It should be of the same format as as the defaults.js file.


#### eval function
The eval function is the entry point to the route. The base function can be defined as follows:
`exports.eval = function (params){}`
and supports being asynchronous. (if thats spelt correct).


The paramaters are as follows:


> 1 Paramater

`(post)` => the post data sent with the request, in JSON format. If the data recieved was not valid JSON, then it will return {body: postDataHere}


> 2 Paramaters

`(post, utils)` => The server util file (optional file, explained further down)


> 3 Paramaters

`(post, request, response)` => The request and response functions (http not express)


> 4 Paramaters

`(post, utils, request, response)` => all data together


And the function should return data in the following format:

`{res: responseVariable, responseCode: int, response: responseBody}`


Note: All paramaters are optional (however it is highly recommended to either return the responseCode or the responseVariable, with a response code set)

All API requests will go through /API/route, and you should not use the API directory outside of these routes

### Dynamic pages
Dynamic pages are web pages that are loaded and edited by the server before sending it to the client.
Go to the /pages/ directory and create an index.js file, which will handle the homepage. It should be of the same format as as the defaults.js file.


> NOTE: You should not place any files in a directory named /API/

#### Dynamic flag
At the top of all your dynamic pages, add the line `exports.dynamic = true;` to tell the server that this is a webpage (and not a static js script)

#### Eval Function
The eval function is the entry point to the route. The base function can be defined as follows:
`exports.eval = function (params){}`
and supports being async.


The paramaters are as follows:

> 1 Paramater

`(req)` => The http request variable, to access headers etc


> 2 Paramaters

`(req, res)` => The http response varialbe, to redirect ans set cookies etc


> 3 Paramaters

`(req, res, utils)` => The server Utils file

And the function should return data in the following format:

`{res: responseVariable, responseCode: int, response: responseBody}`


Note: All paramaters are optional (however it is highly recommended to either return the responseCode and responseBody or the responseVariable, with a response code and body set)

All pages are accessed without file extensions. eg: a file named page.js will load sites on the page http://url.com/page

#### Examples

An example of a dynamicly loaded web page can be found [here](https://github.com/LavaTheif/simple-node-server/wiki/Example-dynamic-index-page) where a page header is loaded in dynamically.


### Static Pages
All other files placed in the /pages/ directory are treated as static files and will be returned as they are. They are accessed by providing their file name and extention (eg index.html or code.js)
You should not place any files in a directory named /API/


### Server Utils
The server utils file is an optional util file that can be passed to all the routes and pages (ideal for managing database connections etc).

The server will give you a warning if it can't load the file named `./server_utils.js`. This could mean it doesn't exist, or contained an error while loading it. This message will be hidden outside of DEV environments.


If you need to initialise the file with data from the config file, add the following function
```
exports.init = function(config){
  //code
}
```
(I like to put `exports.ENV = config.ENV;` in this function, so I can access it globally)

## Load Balancer setup
When you first run the app server, it will generate some keys. These can be ignored if you do not plan on using the load balancer, however if you want to allow your servers to connect, you'll need to add the app server to the load balancer. To do this, simply create a file at `../conf/allowed_servers.json` and add the generated public key to it in the format SERVER_ID:KEY. This will allow your app server to authenticate and start recieving requests


I think thats everything, more stuff coming soon!
