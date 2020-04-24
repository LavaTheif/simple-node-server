let config;
let routes = {};
let dynamic_pages = {};
let static_pages = {};

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
                routes[file.replace(/\.js$/, "")] = require("./routes/" + file);
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
                        dynamic_pages[file.replace(/\.js$/, "")] = require("./pages"+file);
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
        supress_loading_pages = true;
        setInterval(function(){
            loadPages();
            loadAPIroutes();
        }, 1000);
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
                    data = await dynamic_pages[route].eval(req);
                }catch(err){
                    console.err(err);
                    res.writeHead(500);
                    return res.end("Internal Server Error");
                }
                res.writeHead(data.responseCode);
                return res.end(data.response);

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

        if(Object.keys(postDat).length === 0){
            res.writeHead(400);
            return res.end("Malformed request");
        }

        if(routes[route]){
            let data;
            try{
                data = routes[route].eval(postDat);
            }catch(err){
                console.err(err);
                res.writeHead(500);
                return res.end("Internal Server Error");
            }
            res.writeHead(data.responseCode);
            return res.end(data.response);

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
                    resolve({})
                }
            }else{
                resolve({});
            }
        });
    })
}
