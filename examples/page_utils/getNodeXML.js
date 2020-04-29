exports.getWithID = function(data, id){
    if(!data)
        return {node: null, index: -1};
    //iterate over each div element, and find one with the id "header"
    for(let i = 0; i < data.length; i++){
        let node = data[i];
        if(!node['$'])
            continue;

        if(node['$'].id === id){
            return {node, index: i};
        }
    }
    return {node: null, index: -1};
}

exports.getWithClass = function(data, elm_class){
    if(!data)
        return [];

    let nodes = [];
    //iterate over each div element, and find one with the id "header"
    for(let i = 0; i < data.length; i++){
        let node = data[i];
        if(!node['$'])
            continue;

        if(!node['$'].class)
            continue;

        let classlist = node['$'].class.split(" ");
        if(classlist.includes(elm_class)){
            nodes.push({node, index: i});
        }
    }
    return nodes;
}
