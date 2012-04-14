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
    constructor: function (options) {
        this.name = options.name
        var args = this.args = (options.args || []).slice()
        this.cursor = options.cursor || uuid()
        this.method = options.method
        this.commands = []

        if (typeof args[args.length - 1] === "function") {
            args[args.length - 1] = function () {}
        }

        return this
    },
    toArray: tunnelCursorRemote("toArray"),
    nextObject: tunnelCursorRemote("nextObject"),
    each: tunnelCursorRemote("each"),
    count: tunnelCursorRemote("count"),
    sort: storeOrTunnelCommand("sort"),
    limit: storeOrTunnelCommand("limit"),
    skip: storeOrTunnelCommand("skip"),
    batchSize: storeOrTunnelCommand("batchSize"),
    explain: tunnelCursorRemote("explain"),
    close: function (callback) {
        var self = this,
            commands = self.commands.slice()

        commands.push({
            method: "close",
            args: [function () {
                self._closed = true
                callback.apply(this, arguments)
            }]
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
    },
    isClosed: function () {
        return this._closed
    },
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

function storeOrTunnelCommand(method) {
    return function () {
        var self = this,
            args = [].slice.call(arguments),
            cb = args[args.length - 1]

        self.commands.push({
            method: method,
            args: args
        })

        if (typeof cb !== "function") {
            return self
        }
        
        var commands = self.commands.slice()

        args[args.length - 1] = function (err) {
            cb(err, self)
        }

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
    findOne: function () {
        var args = [].slice.call(arguments),
            name = this._name,
            callback = args[args.length - 1]

        if (typeof callback === "function") {
            getRemote(function (remote) {
                remote.sendCollectionCommand({
                    method: "findOne", 
                    name: name, 
                    args: args
                })
            })
        }
        return cursor({
            name: name,
            args: args,
            method: "findOne"
        })
    },
    find: function () {
        var args = [].slice.call(arguments),
            name = this._name,
            callback = args[args.length - 1]

        if (typeof callback === "function") {
            args[args.length - 1] = function (err, cursorName) {
                callback.call(this, err, cursor({
                    cursor: cursorName
                }))
            }

            return getRemote(function (remote) {
                remote.sendCommandWithCursor({
                    method: "find", 
                    name: name, 
                    args: args
                })
            })
        }
        return cursor({
            name: name,
            args: args,
            method: "find"
        })
    },
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

function cursor(options) {
    return Object.create(Cursor).constructor(options)
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
            remote.sendCollectionCommand({
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
                remote.sendCollectionCommand({
                    method: methodName, 
                    name: name, 
                    args: args
                })
            })
        }
        return cursor({
            name: name,
            args: args,
            method: methodName
        })
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
            remote.sendCommandWithCollection({
                method: methodName,
                name: name,
                args: args
            })
        })   
    }
}