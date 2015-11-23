var fs = require("fs");
var _ = require("lodash");
var rimraf = require("rimraf");
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
        verify_checksum: false
    });

    this.options = options;

    this.options.legiond.join(constants.SNAPSHOT);
    this.options.legiond.join(constants.SNAPSHOT_REQUEST);

    this.options.legiond.on(constants.SNAPSHOT_REQUEST, function(message){
        if(_.has(self.volumes, message.data.id)){
            self.volumes.create_snapshot(function(err, checksum){
                if(!err){
                    self.options.legiond.send({
                        event: [constants.SNAPSHOT_PREFIX, message.data.id].join(constants.DELIMITER),
                        data: {
                            id: message.data.id,
                            persistence: self.volumes[message.data.id].type,
                            checksum: checksum
                        },
                        stream: fs.createReadStream([self.options.tmp_path, message.data.id].join("/"))
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
        this.options.legiond.leave([constants.SNAPSHOT_PREFIX, id].join(constants.DELIMITER));

        var stream = fs.createWriteStream([self.options.tmp_path, message.data.id].join("/"));

        stream.on("error", function(err){});

        stream.on("finish", function(){
            self.create_volume({
                id: message.data.id,
                persistence: message.data.persistence
            }, function(err){
                if(err)
                    return fn(err);

                self.volumes[message.data.id].restore_volume({
                    checksum: message.data.checksum
                }, fn);
            });
        });

        message.stream.pipe(stream);
    });
}


CodexD.prototype.remove_volume = function(id, fn){
    var self = this;

    if(_.has(this.volumes, id)){
        rimraf([this.options.base_path, id].join("/"), function(err){
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
