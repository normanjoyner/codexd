var fs = require("fs");
var _ = require("lodash");

function CodexD(legiond){
    var self = this;

    this.legiond = legiond;

    this.volumes = {};
    this.filesystems = {};
    var available_filesystems = fs.readdirSync([__dirname, "filesystems"].join("/"));
    _.each(available_filesystems, function(filesystem){
        var filesystem_name = filesystem.split(".")[0];
        self.filesystems[filesystem_name] = require([__dirname, "filesystems", filesystem].join("/"));
    });
}

CodexD.prototype.add_volume = function(options, fn){
    var self = this;

    if(_.has(this.options, "name") && _.has(this.volumes, options.name))
        return fn(new Error("Volume already exists!"));
    else if(_.has(options, "filesystem") && _.isUndefined(this.filesystems[options.filesystem]))
        return fn(new Error("Filesystem does not exist!"));
    else{
        this.volumes[options.name] = new this.filesystems[options.filesystem](this.legiond);
        this.volumes[options.name].initialize(options, function(err){
            if(err)
                return fn(err);
            else
                return fn(null, self.volumes[options.name]);
        });
    }
}

CodexD.prototype.remove_volume = function(name){}

CodexD.prototype.get_volumes = function(){
    return this.volumes;
}

CodexD.prototype.get_volume = function(name){
    return this.volumes[name];
}

module.exports = CodexD;
