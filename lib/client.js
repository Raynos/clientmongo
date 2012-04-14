var dnode = require("dnode"),
    cached,
    callbackList = []

dnode.connect(function (remote) {
    cached = remote
    callbackList.forEach(function (cb) {
        cb(remote)
    })
})

var Collection = {
    constructor: function (collectionName) {
        this.name = collectionName
        return this
    },
    findOne: tunnelToRemote("findOne"),
    insert: tunnelToRemote("insert"),
    remove: tunnelToRemote("remove"),
    rename: tunnelToRemote("rename"),
    save: tunnelToRemote("save"),
    update: tunnelToRemote("update"),
    distinct: tunnelToRemote("distinct"),
    count: tunnelToRemote("count"),
    drop: tunnelToRemote("drop"),
    findAndModify: tunnelToRemote("findAndModify"),
    findAndRemove: tunnelToRemote("findAndRemove")
}

module.exports = function (name) {
    return Object.create(Collection).constructor(name)
}

function getRemote(cb) {
    if (cached) {
        cb(cached)
    } else {
        callbackList.push(cb)
    }
}

function tunnelToRemote(methodName) {
    return function () {
        var args = [].slice.call(arguments),
            name = this.name

        getRemote(function (remote) {
            remote.sendCommand(methodName, name, args)
        })
    }
}