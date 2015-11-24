var fs = require("fs");
var _ = require("lodash");
var async = require("async");
var tar = require("tar-fs");
var rimraf = require("rimraf");
var utils = require([__dirname, "..", "lib", "utils"].join("/"));
var constants = require([__dirname, "..", "lib", "constants"].join("/"));

function Tar(options){
    this.type = "tar";
    this.options = options;
}

Tar.prototype.initialize = function(fn){
    fs.mkdir([this.options.base_path, this.options.id].join("/"), function(err){
        if(err && err.code != "EEXIST")
            return fn(err);
        else
            return fn();
    });
}

Tar.prototype.create_volume = function(fn){
    return fn();
}


Tar.prototype.create_snapshot = function(fn){
    var volume_location = [this.options.base_path, this.options.id].join("/");
    var tmp_location = [this.options.tmp_path, this.options.id].join("/");

    var checksum = undefined;

    var crypto_stream = utils.crypto_stream("md5", "hex", function(_checksum){
        checksum = _checksum;
    });

    rimraf(tmp_location, function(err){
        if(err)
            return fn(err);

        var stream = fs.createWriteStream(tmp_location);

        stream.on("error", function(err){});

        stream.on("finish", function(){
            return fn(null, checksum);
        });

        tar.pack(volume_location).pipe(crypto_stream).pipe(stream);
    });
}

Tar.prototype.restore_snapshot = function(options, fn){
    var self = this;

    var volume_location = [this.options.base_path, this.options.id].join("/");
    var tmp_location = [this.options.tmp_path, this.options.id].join("/");

    var checksum = undefined;

    var crypto_stream = utils.crypto_stream("md5", "hex", function(_checksum){
        checksum = _checksum;
    });

    rimraf(volume_location, function(err){
        if(err)
            return fn(err);

        var stream = fs.createReadStream(tmp_location);

        var extract = tar.extract(volume_location);

        extract.on("error", function(err){});

        extract.on("finish", function(){
            if(self.options.verify_checksum && options.checksum != checksum)
                return fn(new Error("Checksum mismatch!"));
            else
                return fn();
        });

        stream.pipe(crypto_stream).pipe(extract);
    });
}

Tar.prototype.remove = function(fn){
    var self = this;

    var volume_location = [this.options.base_path, this.options.id].join("/");
    var tmp_location = [this.options.tmp_path, this.options.id].join("/");

    async.parallel([
        function(fn){
            rimraf(volume_location, fn);
        },

        function(fn){
            rimraf(tmp_location, fn);
        }
    ], fn);
}

module.exports = Tar;
