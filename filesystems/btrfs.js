var child_process = require("child_process");
var fs = require("fs");
var _ = require("lodash");
var btrfs = require("btrfs");
var utils = require([__dirname, "..", "lib", "utils"].join("/"));

function BTRFS(legiond){
    this.legiond = legiond;
}

BTRFS.prototype.initialize = function(options, fn){
    var self = this;

    this.options = options;
    this.name = options.name;
    this.mount_point = options.mount_point;
    this.snapshot_location = options.snapshot_location;
    this.volume_location = [this.mount_point, this.name].join("/");
    this.temporary_location = ["", "tmp", "codexd"].join("/");

    fs.mkdir(this.snapshot_location, function(){
        return fn();
    });
}

BTRFS.prototype.create_volume = function(fn){
    var self = this;

    fs.exists(this.volume_location, function(exists){
        if(!exists){
            btrfs.create_subvolume(self.volume_location, function(err){
                return fn(err);
            });
        }
        else
            return fn();
    });
}


BTRFS.prototype.create_snapshot = function(fn){
    var self = this;

    btrfs.create_snapshot(self.volume_location, self.snapshot_location, { readonly: true }, function(err){
        if(err)
            return fn(err);
        else{
            child_process.exec(["btrfs send -f", self.temporary_location, [self.snapshot_location, self.name].join("/")].join(" "), function(err, stdout, stderr){
                return fn(err);
            });
        }
    });
}

BTRFS.prototype.restore_snapshot = function(temporary_location, fn){
    var self = this;

    btrfs.delete_subvolume(this.volume_location, function(err){
        child_process.exec(["btrfs receive -f", temporary_location, self.mount_point].join(" "), function(err, stdout, stderr){
            return fn(err);
        });
    });
}

BTRFS.prototype.send_snapshot = function(host){
    var self = this;

    var snapshot_stream = fs.createReadStream(this.temporary_location);
    this.legiond.send(["codexd", "receive_snapshot", this.name].join("."), {
        options: this.options,
        checksum: utils.get_checksum(data),
        stream: snapshot_stream
    }, host);
}

module.exports = BTRFS;
