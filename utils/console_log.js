let ENV = "PROD";
exports.init = function(env){
    ENV = env;
}

//renames console.log
console.native_log = console.log;

function setLen(number, len){
    //makes sure a number has the correct number of digits
    let str = ""+number;
    while(str.length < len){
        str = "0"+str;
    }
    return str;
}

console.date = function(){
    let d = new Date();
    //Returns year in format YYYY-MM-DD at hh:mm:ss
    return "["+
        d.getFullYear()+"-"+setLen(d.getMonth(), 2)+"-"+setLen(d.getDay(), 2)
        +" at "+
        setLen(d.getHours(), 2)+":"+setLen(d.getMinutes(), 2)+":"+setLen(d.getSeconds(), 2)
        +"]";
};

console.raw_log = function(a){
    console.native_log(console.date(), a);
}

console.debug = function(a){
    if(ENV === "DEV"){
        console.native_log("DEBUG >> ", a);
    }
};

console.log = function(a){
    //TODO: Log to a file
    console.raw_log(a);
};

console.err = function(a){
    //TODO: Log to an error file not console
    console.raw_log(a);
    console.log("ERR >> An error has occurred, see error file for more info");
};
