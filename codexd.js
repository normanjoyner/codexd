var fs = require("fs");
var _ = require("lodash");
var utils = require([__dirname, "lib", "utils"].join("/"));
var constants = require([__dirname, "lib", "constants"].join("/"));
var persistence = require([__dirname, "persistence"].join("/"));

function CodexD(options){
    var self = this;

    this.volumes = {};

    options = _.defaults(options, {
        base_path: ["", "mnt", "codexd"].join("/"),
        tmp_path: ["", "tmp", "codexd"].join("/"),
        persistence: "tar",
        verify_checksum: true
    });

    this.options = options;
    this.constants = constants;

    this.options.legiond.join(constants.REMOVE_SNAPSHOT);
    this.options.legiond.join(constants.SNAPSHOT);
    this.options.legiond.join(constants.SNAPSHOT_REQUEST);

    this.options.legiond.on(constants.REMOVE_SNAPSHOT, function(message){
        if(_.has(self.volumes, message.data.id))
            self.remove_volume(message.data.id, function(){});
    });

    this.options.legiond.on(constants.SNAPSHOT_REQUEST, function(message){
        if(_.has(self.volumes, message.data.id)){
            self.volumes[message.data.id].create_snapshot(function(err, checksum){
                if(!err){
                    self.options.legiond.send({
                        event: [constants.SNAPSHOT_PREFIX, message.data.id].join(constants.DELIMITER),
                        data: {
                            id: message.data.id,
                            persistence: self.volumes[message.data.id].type,
                            checksum: checksum
                        },
                        stream: fs.createReadStream([self.options.tmp_path, message.data.id].join("/"), { encoding: "base64" })
                    });
                }
            });
        }
    });

}

CodexD.prototype.create_uuid = function(){
    return utils.create_uuid();
}

CodexD.prototype.create_volume = function(options, fn){
    var self = this;

    var persistence_type = options.persistence || this.options.persistence;

    if(!_.has(persistence, persistence_type))
        return fn(new Error("Persistence type does not exist!"));

    if(!_.has(options, "id"))
        return fn(new Error("Missing required parameter: id"));

    if(_.has(self.volumes, options.id))
        return fn(new Error("Volume already exists!"));
    else{
        options = _.defaults(options, self.options);
        self.volumes[options.id] = new persistence[self.options.persistence](options);
        self.volumes[options.id].initialize(function(err){
            if(err)
                return fn(err);

            self.volumes[options.id].create_volume(fn);
        });
    }
}

CodexD.prototype.get_snapshot = function(id, fn){
    var self = this;

    this.options.legiond.join([constants.SNAPSHOT_PREFIX, id].join(constants.DELIMITER));

    this.options.legiond.send({
        event: constants.SNAPSHOT_REQUEST,
        data: {
            id: id
        }
    });

    this.options.legiond.on([constants.SNAPSHOT_PREFIX, id].join(constants.DELIMITER), function(message){
        self.options.legiond.leave([constants.SNAPSHOT_PREFIX, id].join(constants.DELIMITER));

        var stream = fs.createWriteStream([self.options.tmp_path, message.data.id].join("/"), { defaultEncoding: "binary" });

        stream.on("error", function(err){});

        stream.on("finish", function(){
            self.create_volume({
                id: message.data.id,
                persistence: message.data.persistence
            }, function(err){
                if(err)
                    return fn(err);

                self.volumes[message.data.id].restore_snapshot({
                    checksum: message.data.checksum
                }, fn);
            });
        });

        message.stream.on("data", function(data){
            stream.write(new Buffer(data.toString(), "base64").toString("binary"), "binary");
        });

        message.stream.on("finish", function(){
            stream.end();
        });
    });
}


CodexD.prototype.remove_volume = function(id, fn){
    var self = this;

    if(_.has(this.volumes, id)){
        this.volumes[id].remove(function(err){
            if(err)
                return fn(err);

            delete self.volumes[id];
            return fn();
        });
    }
}

CodexD.prototype.get_volumes = function(){
    return this.volumes;
}

CodexD.prototype.get_volume = function(id){
    return this.volumes[id];
}

module.exports = CodexD;
