var crypto = require("crypto");
var passthrough_stream = require("pass-stream");

function CryptoStream(algorithm, encoding, callback){
    var hash = crypto.createHash(algorithm);

    function write(data, encoding, fn){
        hash.update(data);
        this.push(data);
        return fn();
    }

    function end(fn){
        callback(hash.digest(encoding), length);
        return fn();
    }

    return passthrough_stream(write, end);
}

module.exports = CryptoStream;
