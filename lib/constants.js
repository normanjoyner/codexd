var _ = require("lodash");

var constants = {
    DELIMITER: "::",
    REMOVE_SNAPSHOT: ["codexd", "remove_snapshot"],
    SNAPSHOT_PREFIX: ["codexd", "snapshot"],
    SNAPSHOT_REQUEST: ["codexd", "get_snapshot"],
    TEMP_DIR: ["", "tmp", "codexd"].join("/")
}

_.each(constants, function(value, key){
    if(_.isArray(value))
        constants[key] = value.join(constants.DELIMITER);
});

module.exports = constants;
