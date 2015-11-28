var pkg = require([__dirname, "package"].join("/"));
var CodexD = require([__dirname, "codexd"].join("/"));

module.exports = function(options){
    var codexd = new CodexD(options);
    codexd.version = pkg.version;
    return codexd;
}
