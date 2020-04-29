const loadXML = require('./loadXML').load;
const insertXML = require('./insertXML').insert;
const getByID = require('./getNodeXML').getWithID;
const getByClass = require('./getNodeXML').getWithClass;

exports.loadHeader = async function (pageJson, auth) {
    return new Promise((resolve, reject) => {
        loadXML("header.xml")
            .then(async function (header) {
                //This is where our header goes.
                //get the data in our content tag
                let headerContent = header.content;


                //You can edit the headers content here


                //get all div elements from the page body
                let data = pageJson.html.body[0].div;

                //get the header div
                let dat = getByID(data, "header");
                let node = dat.node;

                //evaluate save this node to the page data
                insertXML(node, headerContent);

                //return it to client
                resolve(pageJson);
            }).catch(function (err) {
            console.err(err);
            resolve(pageJson);
        });
    });
}
