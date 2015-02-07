var child_process = require("child_process");
var fs = require("fs");
var _ = require("lodash");

function BTRFS(legiond){
    this.legiond = legiond;
}

BTRFS.prototype.initialize = function(options, fn){
    var self = this;

    this.options = options;
    this.name = options.name;
    this.mount_point = options.mount_point;
    this.volume_location = [this.mount_point, this.name].join("/");
    this.snapshots_location = [this.snapshot_location, this.name].join("/");
    this.temporary_location = ["", "tmp", "codexd"].join("/");

    fs.mkdir(this.snapshots_location, fn);
}

BTRFS.prototype.create_volume = function(fn){
    var self = this;

    fs.exists(this.volume_location, function(exists){
        if(!exists){
            child_process.exec(["btrfs subvolume create", self.volume_location].join(" "), function(err, stdout, stderr){
                return fn(err);
            });
        }
        else
            return fn();
    });
}


BTRFS.prototype.create_snapshot = function(fn){
    var self = this;

    var timestamp = new Date().valueOf();
    var snapshot_location = [this.snapshots_location, timestamp].join("/");

    child_process.exec(["btrfs subvolume snapshot -r", this.volume_location, snapshot_location].join(" "), function(err, stdout, stderr){
        if(err)
            return fn(err);
        else{
            child_process.exec(["btrfs send -f", self.temporary_location, snapshot_location].join(" "), function(err, stdout, stderr){
                return fn(err);
            });
        }
    });
}

BTRFS.prototype.restore_snapshot = function(temporary_location, fn){
    child_process.exec(["btrfs receive -f", temporary_location, this.volume_location].join(" "), function(err, stdout, stderr){
        return fn(err);
    });
}

BTRFS.prototype.send_snapshot = function(host){
    var self = this;

    fs.readFile(this.temporary_location, function(err, snapshot){
        if(_.isNull(err)){
            var data = snapshot.toJSON();

            self.legiond.send(["codexd", "receive_snapshot", self.name].join("."), {
                options: self.options,
                checksum: utils.get_checksum(data),
                data: data
            }, host);
        }
    });
}

module.exports = BTRFS;
