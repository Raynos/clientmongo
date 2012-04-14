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
    findOne: function () {
        var args = [].slice.call(arguments),
            name = this.name

        getRemote(function (remote) {
            remote.sendCommand("findOne", name, args)
        })
    }
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