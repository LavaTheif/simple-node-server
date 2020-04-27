let config;
let routes = {};
let dynamic_pages = {};
let static_pages = {};
let utils;

//https://en.wikipedia.org/wiki/List_of_HTTP_status_codes

//TODO: on request, check if its in the var, and call eval request
//TODO: if the requested route is not in the var, return a 404 err

//This function sets up the server. It loads the listeners and initialises data that will be required.
exports.init = function(app_svr){
    //stores the config file
    this.config = app_svr.config;

    //sets up a http server for clients to request data.
    //TODO: Force HTTPS
    const http = require("http");
    const fs = require("fs");
    const path = require('path');

    let supress_loading_pages = false;

    function loadAPIroutes(dir = "/") {
        // iterate over /routes and load them into the JSON var 'routes'
        fs.readdir("./routes"+dir, (err, files) => {
            files.forEach(file => {
                if(isDir(file))
                    return loadAPIroutes(dir + file+"/");

                if(!supress_loading_pages)
                    console.log("Loading: /API/" + file);

                let id = file.replace(/\.js$/, "");
                routes[id] = require("./routes/" + file);
                routes[id].config = app_svr.config;
            });
            if(dir === "/")
                if(!supress_loading_pages)
                    console.log("API routes initialised");
        });
    }

    function loadPages(dir = "/") {
        fs.readdir("./pages"+dir, (err, files) => {
            files.forEach(file => {
                if(isDir(file))
                    return loadPages(dir + file+"/");

                //prepend current directory to the file
                file = dir+file;
                if(!supress_loading_pages)
                    console.log("Loading page: " + file);

                //check if file is a .js file
                if(file.match(/\.js$/)){
                    //load it as a script and check for dynamic tag
                    let script = fs.readFileSync("./pages" + file);
                    //kinda feels like a hack but if we require it and its just a regular js file intended for the client, it will throw errors
                    if(script.toString().replace(/ /g,"").includes("exports.dynamic=true;")){
                        let id = file.replace(/\.js$/, "");
                        dynamic_pages[id] = require("./pages"+file);
                        dynamic_pages[id].config = app_svr.config;
                    }else{
                        //page is not dynamic
                        static_pages[file] = script;
                    }
                }else{
                    //static page
                    static_pages[file] = fs.readFileSync("./pages" + file);
                }
            });
            if(dir === "/")
                if(!supress_loading_pages)
                    console.log("Pages initialised");
        });
    }

    function isDir(pathItem) {
        return !path.extname(pathItem);
    }

    console.log("Initialising API routes");
    loadAPIroutes();
    console.log("Initialising pages");
    loadPages();

    if(this.config.refresh_pages){
        setInterval(function(){
            supress_loading_pages = true;
            loadPages();
            loadAPIroutes();
        }, 1000);
    }

    //Load the server utils. Useful for reusing db connections between routes
    try{
        console.log("Loading server utils");
        utils = require("./server_utils.js");
        console.log("Loaded server utils");
        if(utils.init){
            console.log("Initialising server utils");
            utils.init(this.config);
            console.log("Server utils initialised");
        }
    }catch(e){
        console.debug({
            ALERT: "ERROR",
            message: "There was an error with your utils file and it could not be loaded",
            info: "This could mean the code is buggy, or the file does not exist.",
            solution: "If you have a utils file, you should take a look at it. If one is not needed, you can either ignore this message, or create a blank file",
            note: "This message will only be shown in the development environment.",
            filename: "./server_utils.js",
            errorMsg: {e}
        });
        console.log("Could not find a utils file, continuing without one.");
        utils = {};
    }

    let handler = async function (req, res) {
        //if this doesnt change, then an error occurred.
        res.writeHead(500);

        //Removes anything after the ?
        let route = req.url.replace(/\?.*$/, "").toLowerCase();
        console.debug(route);

        ///all routes should be to /API/
        if(!route.startsWith("/api/")){

            if(route.endsWith("/")) {
                route = route + "index";
            }

            if (req.headers['access-control-request-headers']){
                //just a request header, don't return content.
                res.writeHead(200);
                return res.end("");
            }

            //check if the page is a dynamic page
            if(dynamic_pages[route]){
                let data;

                try{
                    let evalFunc = dynamic_pages[route].eval;
                    if(evalFunc.length === 1){
                        //Dont send res or utils
                        data = await evalFunc(req);
                    }else if(evalFunc.length === 2){
                        //send res, dont send utils
                        data = await evalFunc(req, res);
                    }else{
                        //send res and utils
                        //dont worry about checking if its 3 params, node will handle that error for us
                        data = await evalFunc(req, res, utils);
                    }
                }catch(err){
                    console.err(err);
                    res.writeHead(500);
                    return res.end("Internal Server Error");
                }
                if(data.res){
                    res = data.res;
                }
                if(data.responseCode)
                    res.writeHead(data.responseCode);

                if(data.response)
                    return res.end(data.response);
                else
                    return res.end();

            }else if(static_pages[route]){
                //checks if the page is static
                res.writeHead(200);
                return res.end(static_pages[route]);

            }else{
                res.writeHead(404);
                return res.end("Page not found");
            }
        }else{
            //can remove the /api/ now
            route = route.replace(/^\/api\//,"");

            if(route === ""){
                res.writeHead(404);
                return res.end("Route not found");
            }
        }

        if (req.headers['access-control-request-headers']){
            //just a request header, don't return content.
            res.writeHead(200);
            return res.end("");
        }

        let postDat = {};
        if (req.method === 'POST') {
            //load all the post data into the postDat variable as a JSON object
            postDat = await getPostDat(req);
        }else{
            res.writeHead(405);
            return res.end("POST method route");
        }

        // if(Object.keys(postDat).length === 0){
        //     res.writeHead(400);
        //     return res.end("Malformed request");
        // }

        if(routes[route]){
            let data;
            try{
                let evalFunc = routes[route].eval;
                if(evalFunc.length === 1){
                    //Dont send req, res, or utils
                    data = await evalFunc(postDat);
                }else if(evalFunc.length === 2){
                    //Dont send req and res, send utils
                    data = await evalFunc(postDat, utils);
                }else if(evalFunc.length === 3){
                    //send just req and res, dont send utils
                    data = await evalFunc(postDat, req, res);
                }else{
                    //send req and res and utils
                    //dont worry about checking if its 4 params, node will handle that error for us
                    data = await evalFunc(postDat, utils, req, res);
                }
            }catch(err){
                console.err(err);
                res.writeHead(500);
                return res.end("Internal Server Error");
            }
            if(data.res){
                res = data.res;
            }
            if(data.responseCode)
                res.writeHead(data.responseCode);

            if(data.response)
                return res.end(data.response);
            else
                return res.end();

        }else{
            res.writeHead(404);
            return res.end("Route not found");
        }
    };

    console.log("Creating HTTP server");
    var server = http.createServer();

    console.log("Initialising HTTP server");
    //TODO: server.setSecure(credentials);
    server.addListener("request", handler);

    const port = 8080;
    server.listen(port);
    console.log("HTTP Server listening on port "+port);
};

async function getPostDat(req) {
    //get the post data sent by the client
    return new Promise(function (resolve) {
        let body = '';

        req.on('data', function (data) {
            body += data;

            // Too much data sent
            if (body.length > 1e6)
                req.connection.destroy();
        });

        //resolve the data back to the parent function, returning it as a JSON object
        req.on('end', function () {
            if (body){
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    try{
                        resolve(JSON.parse('{"' + body.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) }))
                    }catch (ee){
                        resolve({body: body})
                    }
                }
            }else{
                resolve({});
            }
        });
    })
}
