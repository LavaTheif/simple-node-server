const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

exports.load = async function(file){
    let xml_str = fs.readFileSync('./html_templates/'+file);

    return new Promise((resolve, reject) => {
        parser.parseString(xml_str, function (err, jsonDat) {
            if(err){
                console.err(err);
                return reject(err);
            }
            return resolve(jsonDat);
        });
    });

}