var dnode = require("dnode"),
    uuid = require("node-uuid"),
    pd = require("pd")

var getRemote = pd.memoize(dnode.connect, dnode)

var Cursor = {
    constructor: function (options) {
        this.name = options.name
        this.db = options.db
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
                db: self.db,
                cursor: self.cursor,
                name: self.name,
                auth: self.auth,
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
                db: self.db,
                cursor: self.cursor,
                name: self.name,
                auth: self.auth,
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
            auth = this.auth,
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
                db: self.db,
                cursor: self.cursor,
                name: self.name,
                auth: self.auth,
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
    constructor: function (collectionName, databaseName, auth) {
        if (typeof databaseName === "function") {
            auth = databaseName
            databaseName = null
        }
        this._name = collectionName
        this.collectionName = collectionName
        this.databaseName = databaseName
        this.auth = auth
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
            db = this.databaseName,
            auth = this.auth,
            callback = args[args.length - 1]

        if (typeof callback === "function") {
            getRemote(function (remote) {
                remote.sendCollectionCommand({
                    method: "findOne", 
                    name: name,
                    db: db,
                    auth: auth,
                    args: args
                })
            })
        }
        return cursor({
            name: name,
            args: args,
            db: db,
            method: "findOne"
        }, auth)
    },
    find: function () {
        var args = [].slice.call(arguments),
            name = this._name,
            db = this.databaseName,
            auth = this.auth,
            callback = args[args.length - 1]

        if (typeof callback === "function") {
            args[args.length - 1] = function (err, cursorName) {
                callback.call(this, err, cursor({
                    cursor: cursorName,
                    name: name,
                    args: args,
                    db: db,
                    method: "find"
                }, auth))
            }

            return getRemote(function (remote) {
                remote.sendCommandWithCursor({
                    method: "find", 
                    name: name,
                    db: db,
                    auth: auth,
                    args: args
                })
            })
        }
        return cursor({
            name: name,
            args: args,
            db: db,
            method: "find"
        }, auth)
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

module.exports = function (name, databaseName, auth) {
    return collection(name, auth)
}

function collection(name, databaseName, auth) {
    return Object.create(Collection).constructor(name, databaseName, auth)
}

function cursor(options, auth) {
    return Object.create(Cursor).constructor(options, auth)
}

function tunnelToRemote(methodName) {
    return function () {
        var args = [].slice.call(arguments),
            name = this._name,
            db = this.databaseName,
            auth = this.auth

        getRemote(function (remote) {
            remote.sendCollectionCommand({
                method: methodName,
                name: name,
                db: db,
                args: args,
                auth: auth
            })
        })
    }
}

function tunnelToRemoteWithCursor(methodName) {
    return function () {
        var args = [].slice.call(arguments),
            name = this._name,
            db = this.databaseName,
            auth = this.auth,
            callback = args[args.length - 1]

        if (typeof callback === "function") {
            getRemote(function (remote) {
                remote.sendCollectionCommand({
                    method: methodName, 
                    name: name, 
                    db: db,
                    auth: auth,
                    args: args
                })
            })
        }
        return cursor({
            name: name,
            args: args,
            db: db,
            method: methodName
        }, auth)
    }
}

function tunnelToRemoteWithCollection(methodName) {
    return function () {
        var args = [].slice.call(arguments),
            cb = args[args.length - 1],
            auth = this.auth,
            db = this.databaseName,
            name = this._name

        args[args.length - 1] = function (err, collectionName) {
            cb(err, 
                collectionName && collection(collectionName, auth))
        }

        getRemote(function (remote) {
            remote.sendCommandWithCollection({
                method: methodName,
                name: name,
                db: db,
                auth: auth,
                args: args
            })
        })   
    }
}