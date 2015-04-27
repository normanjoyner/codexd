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
            else{
                var event_name = ["codexd", "request_snapshot", options.name].join(".");
                self.legiond.join(event_name);

                self.legiond.on(event_name, function(json){
                    self.volumes[options.name].create_snapshot(function(err){
                        if(err)
                            return fn(err);
                        else
                            self.volumes[options.name].send_snapshot(json.author);
                    });
                });

                if(_.has(options, "mount_point")){
                    self.volumes[options.name].create_volume(function(err){
                        return fn(err, self.volumes[options.name]);
                    });
                }
                else
                    return fn(null, self.volumes[options.name]);
            }
        });
    }
}

CodexD.prototype.get_snapshot = function(host, name, fn){
    var self = this;

    var event_name = ["codexd", "receive_snapshot", name].join(".");
    this.legiond.join(event_name);

    this.legiond.on(event_name, function(json){
        self.legiond.leave(event_name);
        self.add_volume(json.data.options, function(err, volume){
            if(err)
                return fn(err);
            else{
                var temporary_location = ["", "tmp", new Date().valueOf()].join("/");
                var snapshot_stream = fs.createWriteStream(temporary_location);

                json.stream.pipe(snapshot_stream);

                snapshot_stream.on("finish", function(){
                    volume.restore_snapshot(temporary_location, function(err){
                        if(err)
                            return fn(err);
                        else
                            return fn();
                    });
                });
            }
        });
    });

    this.legiond.send(["codexd", "request_snapshot", name].join("."), {}, host);
}

CodexD.prototype.remove_volume = function(name){
    var event_name = ["codexd", "request_snapshot", name].join(".");
    this.legiond.leave(event_name);
}

CodexD.prototype.get_volumes = function(){
    return this.volumes;
}

CodexD.prototype.get_volume = function(name){
    return this.volumes[name];
}

module.exports = CodexD;
