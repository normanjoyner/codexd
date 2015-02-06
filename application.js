var pkg = require([__dirname, "package"].join("/"));
var CodexD = require([__dirname, "codexd"].join("/"));

module.exports = function(legiond){
    var codexd = new CodexD(legiond);
    codexd.version = pkg.version;
    return codexd;
}
