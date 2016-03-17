# codexd

##About

###Description
Filesystem snapshotting and replication build atop LegionD. CodexD currently implements one persistence type: tar. Future persistence types include btrfs and zfs.

###Author
ContainerShip Developers - developers@containership.io

##Getting Started

###Demos
[CodexD Demo: Migrating a Redis Database](https://vimeo.com/containership/codexd-demo-migrating-a-redis-database)
[CodexD Demo: Migrating a Quarry DNS Server](https://vimeo.com/containership/codexd-demo-migrating-a-quarry-dns-server)

###Installation
`npm install codexd --save`

###Examples

####Instantiation
Instantiates a new CodexD object. It is important to note that CodexD depends on LegionD.
```javascript
var CodexD = require("codexd");
var LegionD = require("legiond");
var legiond = new LegionD();

var codexd = new CodexD({
    legiond: legiond
});
```

####Create a Volume
Create a new volume to be managed by CodexD.
```javascript
var uuid = codexd.create_uuid();

codexd.create_volume({
    id: uuid
}, function(err){
    if(err)
        throw err;
});
```
####Get Volumes
Get all volumes.
```javascript
console.log(codexd.get_volumes());
```

####Get Volume
Get a specific volume.
```javascript
console.log(codexd.get_volumes(uuid));
```

####Get Snapshot
Searches LegionD cluster for desired volume, creates a snapshot, transfers it to the current legiond node, and restores it.
```javascript
codexd.get_snapshot(uuid, function(err){
    if(err)
        throw err;
});
```

####Remove a Volume
```javascript
codexd.remove_volume(uuid, function(err){
    if(err)
        throw err;
});
```

##Contributing
Pull requests and issues are encouraged! Help us make CodexD even more awesome :)
