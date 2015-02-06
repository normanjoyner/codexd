var child_process = require("child_process");
var fs = require("fs");
var mkdirp = require("mkdirp");

function BTRFS(legiond){
    this.legiond = legiond;
}

BTRFS.prototype.initialize = function(options, fn){
    var self = this;

    this.name = options.name;
    this.mount_point = options.mount_point;
    this.volume_location = [this.mount_point, this.name, "data"].join("/");
    this.snapshots_location = [this.mount_point, this.name, "snapshots"].join("/");
    this.temporary_location = ["", "tmp", "codexd"].join("/");

    mkdirp(this.snapshots_location, function(err){
        if(err)
            return fn(err);

        fs.exists(self.volume_location, function(exists){
            if(!exists){
                child_process.exec(["btrfs subvolume create", self.volume_location].join(" "), function(err, stdout, stderr){
                    return fn(err);
                });
            }
            else
                return fn();
        });
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

BTRFS.prototype.send_snapshot = function(){
    var self = this;

    fs.readFile(this.temporary_location, function(err, snapshot){
        if(_.isNull(err)){
            self.legiond.send("codexd.snapshot", {
                snapshot: snapshot.toJSON()
            }, host);
        }
    });
}

module.exports = BTRFS;
