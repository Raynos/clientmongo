var dnode = require("dnode"),
    uuid = require("node-uuid"),
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
        this.cursor = uuid()
        this.method = method
        this.commands = []

        if (typeof args[args.length - 1] === "function") {
            args[args.length - 1] = function () {}
        }

        return this
    },
    toArray: tunnelCursorRemote("toArray"),
    nextObject: tunnelCursorRemote("nextObject"),
    nextObject: tunnelCursorRemote("each"),
    rewind: storeCommand("rewind")
}

function tunnelCursorRemote(method) {
    return function () {
        var self = this,
            commands = self.commands.slice()

        commands.push({
            method: method,
            args: [].slice.call(arguments)
        })

        self.commands = []

        getRemote(function (remote) {
            remote.sendCursorCommand({
                method: self.method,
                args: self.args,
                cursor: self.cursor,
                name: self.name,
                commands: commands
            })
        })

        return self
    }
}

function storeCommand(method) {
    return function () {
        var self = this

        self.commands.push({
            method: method,
            args: [].slice.call(arguments)
        })

        return self
    }
}

var Collection = {
    constructor: function (collectionName) {
        this._name = collectionName
        this.collectionName = collectionName
        return this
    },
    findOne: tunnelToRemote("findOne"),
    insert: tunnelToRemote("insert"),
    remove: tunnelToRemote("remove"),
    rename: tunnelToRemoteWithCollection("rename"),
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
    mapReduce: tunnelToRemoteWithCollection("mapReduce"),
    group: tunnelToRemote("group"),
    indexExists: tunnelToRemote("indexExists"),
    geoNear: tunnelToRemote("geoNear"),
    geoHaystackSearch: tunnelToRemote("geoHaystackSearch"),
    indexes: tunnelToRemote("indexes"),
    stats: tunnelToRemote("stats")
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