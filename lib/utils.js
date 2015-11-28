var crypto = require("crypto");
var uuid = require("node-uuid");
var CryptoStream = require([__dirname, "crypto-stream"].join("/"));

module.exports = {

    create_uuid: function(){
        return uuid.v4();
    },

    crypto_stream: function(algorithm, encoding, fn){
        return new CryptoStream(algorithm, encoding, fn);
    },

    get_checksum: function(content){
        return crypto.createHash("md5").update(content.toString(), "utf8").digest("hex");
    }

}
