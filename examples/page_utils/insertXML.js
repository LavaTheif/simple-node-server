exports.insert = function(node, content){
    let elements = Object.keys(content);
    for(let i = 0; i < elements.length; i++){
        //get current elm key
        let key = elements[i];
        //set the value of that key to the one in our header
        node[key] = content[key];
    }
    return node;
}