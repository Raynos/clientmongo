var dnode = require("dnode"),
    cached,
    callbackList = []

dnode.connect(function (remote) {
    cached = remote
    callbackList.forEach(function (cb) {
        cb(remote)
    })
})

var Cursor = {
    constructor: function (collectionName, args, method) {
        args = args.slice()
        this.name = collectionName
        this.args = args
        this.method = method
        this.commands = []

        if (typeof args[args.length - 1] === "function") {
            args[args.length - 1] = function () {}
        }

        return this
    },
    toArray: function () {
        var self = this

        self.commands.push({
            method: "toArray",
            args: [].slice.call(arguments)
        })

        getRemote(function (remote) {
            remote.sendCursorCommand({
                method: self.method,
                args: self.args,
                name: self.name,
                commands: self.commands
            })
        })
    }
}

var Collection = {
    constructor: function (collectionName) {
        this._name = collectionName
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
    findAndRemove: tunnelToRemote("findAndRemove"),
    findOne: tunnelToRemoteWithCursor("findOne"),
    find: tunnelToRemoteWithCursor("find"),
    createIndex: tunnelToRemote("createIndex"),
    ensureIndex: tunnelToRemote("ensureIndex"),
    indexInformation: tunnelToRemote("indexInformation"),
    dropIndex: tunnelToRemote("dropIndex"),
    dropAllIndexes: tunnelToRemote("dropAllIndexes"),
    reIndex: tunnelToRemote("reIndex"),
    mapReduce: tunnelToRemoteWithCollection("mapReduce")
}

module.exports = function (name) {
    return collection(name)
}

function collection(name) {
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
            name = this._name

        getRemote(function (remote) {
            remote.sendCommand({
                method: methodName,
                name: name,
                args: args
            })
        })
    }
}

function tunnelToRemoteWithCursor(methodName) {
    return function () {
        var args = [].slice.call(arguments),
            name = this._name,
            callback = args[args.length - 1]

        if (typeof callback === "function") {
            getRemote(function (remote) {
                remote.sendCommand({
                    method: methodName, 
                    name: name, 
                    args: args
                })
            })
        }
        return Object.create(Cursor).constructor(name, args, methodName)
    }
}

function tunnelToRemoteWithCollection(methodName) {
    return function () {
        var args = [].slice.call(arguments),
            cb = args[args.length - 1]
            name = this._name

        args[args.length - 1] = function (err, collectionName) {
            cb(err, 
                collectionName && collection(collectionName))
        }

        getRemote(function (remote) {
            remote.sendCollectionCommand({
                method: methodName,
                name: name,
                args: args
            })
        })   
    }
}