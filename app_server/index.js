//Gets the command line args and the runtime environment
let args = process.argv.slice(2);
let ENV = require("../conf/ENV.json").env;

//Dependencies
const fs = require('fs');

//Load in the servers private key
let priv_key;
if (fs.existsSync("../conf/privateKey.json")) {
    priv_key = fs.readFileSync("../conf/privateKey.json");
} else {
    console.info("No keys detected. Generating new ones.");
    const {generateKeyPair} = require('crypto');
    generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        }
    }, (err, publicKey, privateKey) => {
        if (err)
            return console.log(err);

        let id = Math.floor(Math.random() * 2147483647);
        console.log(id);
        let json = {};

        json[id] = privateKey;
        fs.writeFileSync("../conf/privateKey.json", JSON.stringify(json));

        json[id] = publicKey;
        fs.writeFileSync("../conf/pubKey.json", JSON.stringify(json));
        console.info("Keys Generated.");
        console.info("Please add the JSON in '../conf/pubKey.json' to the allowed servers on the load balancer");
    });
    return;
}

//config file
exports.config;

//FLAGS
let silent_update_conf = false;
let gen_new_conf = false;
let use_load_balancer = true;
let refresh_pages = false;

//Process all arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === "help") {
        console.info("###Arguments###");
        console.info("");
        console.info("");
        console.info("--new-conf \t|\tgenerates a new environment config file (based on defaults.json)");
        console.info("--quiet-upd\t|\tif the config is missing elements, import the new ones from the defaults and suppress warnings");
        console.info("--conf=name\t|\trun using a specific config file rather than the environment config");
        console.info("--env=env  \t|\tset the environment from the command line and override the ENV file");
        console.info("--no-load  \t|\tDon't use the load balancer (intended for development purposes)");
        console.info("--refresh  \t|\tReloads the pages every second (intended for development purposes)");
        console.info("");
        console.info("");
        console.info("Note: --new-conf will generate a default config and terminate the process. To continue execution, use --quiet-upd");
        return;
    } else if (args[i] === "--new-conf") {
        //set the new config flag
        gen_new_conf = true;
    } else if (args[i] === "--quiet-upd") {
        //set the silent update flag
        silent_update_conf = true;
    } else if (args[i].match(/^--env=[a-zA-Z0-9]*$/)) {
        //Sets the environment
        ENV = args[i].replace("--env=", "");
    } else if (args[i].match(/^--conf=[a-zA-Z0-9]*$/)) {
        //Sets the environment
        exports.config = args[i].replace("--conf=", "");
    } else if (args[i].match(/^--no-load$/)) {
        //Disable load balancer
        use_load_balancer = false;
    } else if (args[i].match(/^--refresh$/)) {
        //enable reloading of pages for development
        refresh_pages = true;
    }
}

//global functions
let consoleUtils = require("../utils/console_log.js");

//initialises the console utils
consoleUtils.init(ENV);

console.debug({ENV, "config": exports.config, silent_update_conf, gen_new_conf});

if (gen_new_conf) {
    try {
        let file;
        if (!exports.config) {
            //no config specified in args, so get environment default.
            file = ENV + ".json";
        } else {
            //config was specified in args, use that one instead
            file = exports.config + ".json";
        }
        file = "../conf/" + file;

        //Check if the file exists already (we don't want to override it!)
        if (fs.existsSync(file)) {
            console.log(file + " already exists, continuing execution.");
            //we can just continue execution.
        } else {
            //generate a blank config file. We will initialise it later on.
            fs.writeFileSync(file, "{}");
            console.log("Successfully generated config as " + file);
        }
    } catch (err) {
        //probably a permission error
        console.err(err);
        return;
    }
}

function check_config(json, defaults) {
    //Assume that they are the same
    let is_identical = true;

    //gets the default keys
    let required_keys = Object.keys(defaults);

    //loop over all the keys and check them
    for (let i = 0; i < required_keys.length; i++) {
        let key = required_keys[i];
        //ignore the comments
        if (key.match(/^__comment__[0-9]*$/)) {
            //add comments to the file, but dont throw an error if it wasn't there
            if (!json[key])
                json[key] = defaults[key];
            continue;
        }

        //check if supplied JSON has that key
        if (!json[key]) {
            //not found, add it to
            is_identical = false;
            json[key] = defaults[key];
            console.log("Current config missing value " + key + ". Inserting it into the config.");
        } else if (typeof json[key] === typeof {}) {
            //The current element is also JSON, therefore we need to check it.
            let dat = check_config(json[key], defaults[key]);
            //If it is currently identical, update the status
            if (is_identical)
                is_identical = dat['valid'];

            //remove this and save the data to the current json
            delete dat['valid'];
            json[key] = dat;
        }
    }
    json['valid'] = is_identical;
    return json;
}

try {
    let file = "";
    if (!exports.config) {
        //no config specified in args, so get environment default.
        file = "../conf/" + ENV + ".json";
        console.log("Loading config for " + ENV + " env.");
    } else {
        //config was specified in args, use that one instead
        file = "../conf/" + exports.config + ".json";
        console.log("Loading config file.");
    }
    //require the config
    exports.config = require(file);
    console.log("Checking config file");

    //get the default config, and iterate over each value to check its valid.
    let defaults = require('../conf/defaults');
    let json = check_config(exports.config, defaults);
    let up_to_date = json.valid;
    delete json.valid;

    //Config missing values (not up to date)
    if (!up_to_date) {
        fs.writeFileSync(file, JSON.stringify(json));

        if (silent_update_conf) {
            console.log("Config loaded with default values.");
        } else {
            console.log("Please edit the config and re-run the program");
            return;
        }
    } else {
        console.log("Valid config, starting the server");
    }
} catch (err) {
    console.err(err);
    console.log("Config not found. Please create a config, or run again with argument --new-conf to generate a new conf file");
    return;
}
//add any flags to the config
exports.config.refresh_pages = true;

//initialise the request manager.
const rm = require("./request_manager.js");
rm.init(this);

if (use_load_balancer) {
//connect to the server pool
    const pool = require("./pool_connector");
    pool.init(this);
}
