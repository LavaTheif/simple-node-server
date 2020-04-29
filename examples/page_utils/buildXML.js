const xml2js = require('xml2js');
const builder = new xml2js.Builder({headless: true, renderOpts: {pretty: true, allowEmpty: true}});

exports.build = function(pageData) {
    //build the html document
    let xml = builder.buildObject(pageData);
    xml = "<!DOCTYPE html>\n" + xml;
    return xml
}