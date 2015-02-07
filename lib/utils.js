var crypto = require("crypto");

module.exports = {

    get_checksum: function(content){
        return crypto.createHash("md5").update(content.toString(), "utf8").digest("hex");
    }

}
