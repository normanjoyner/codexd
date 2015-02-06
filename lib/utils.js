var crypto = require("crypto");

module.exports = {

    generate_checksum: function(content){
        return crypto.createHash("md5").update(content, "utf8").digest("hex");
    }

}
