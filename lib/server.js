var mongocol = require("mongo-col"),
    uuid = require("node-uuid"),
    dnode = require("dnode"),
    extend = require("pd").extend,
    cachedCollections = {},
    cachedCursors = {}

var Methods = {
    constructor: function (conn, auth) {
        this.conn = conn
        this.auth = auth
        conn.cursors = {}
        conn.collections = {}
        return this
    },
    sendCollectionCommand: auth(function (options) {
        //console.log("sendCommand", options)
        var col = getCollection(options.name)

        invoke(col, options.method, options.args)
    }),
    sendCommandWithCollection: auth(function (options) {
        var col = getCollection(options.name),
            collections = this.conn.collections,
            args = options.args,
            cb = args[args.length - 1]

        args[args.length - 1] = function (err, collection) {
            var name
            if (collection && 
                collection.collectionName !== "tempCollection"
            ) {
                name = collection.collectionName
            } else {
                name = uuid()
            }
            cachedCollections[name] = collection
            collections[name] = collection
            cb(err, name)
        }

        invoke(col, options.method, options.args)
    }),
    sendCommandWithCursor: auth(function (options) {
        var col = getCollection(options.name),
            cursors = this.conn.cursors,
            args = options.args,
            cb = args[args.length - 1]

        args[args.length - 1] = function (err, cursor) {
            var name = uuid()
            cachedCursors[name] = cursor
            cursors[name] = cursor
            cb(err, name)
        }

        invoke(col, options.method, options.args)
    }),
    sendCursorCommand: auth(function (options) {
        var cursor = getCursor(options, this.conn)
        //console.log("sendCursorCommand", options.name, options.commands)
        options.commands.forEach(function (command) {
            //console.log("invoking command", command.method, command.args)
            invoke(cursor, command.method, command.args)
        })
    })
}

function auth(callback) {
    return function (options) {
        if (!this.auth) {
            return callback.apply(this, arguments)
        }
        var args = options.args,
            _arguments = arguments,
            self = this,
            cb = args[args.length - 1]

        if (typeof cb !== "function") {
            cb = function () {}
        }

        var ret = this.auth(options.auth, options, handleAuth)

        if (ret !== undefined) {
            handleAuth(ret)
        }

        function handleAuth(ret) {
            if (ret === false) {
                cb(new Error("Permission Denied"))
            } else if (ret === true) {
                callback.apply(self, _arguments)
            }    
        }
    }
}

module.exports = function (httpServer, auth) {
    if (typeof httpServer === "string") {
        return mongocol(httpServer)
    }
    dnode(function (remote, conn) {
        extend(this, Methods).constructor(conn, auth)

        conn.on("end", function () {
            Object.keys(conn.cursors).forEach(function (cursorId) {
                delete cachedCursors[cursorId]
            })
            Object.keys(conn.collections).forEach(function (collectionId) {
                delete cachedCollections[collectionId]
            })
        })
    }).listen(httpServer)
    return mongocol
}

function invoke(obj, name, args) {
    try {
        return obj[name].apply(obj, args)
    } catch (err) {
        //console.log("args", err, name, args)
        var cb = args && args[args.length - 1]
        if (typeof cb === "function") {
            cb(err)
        } else {
            console.log("Unhandled error in clientmongo", err)
        }
    }
}

function getCursor(options, conn) {
    if (cachedCursors[options.cursor]) {
        return cachedCursors[options.cursor]
    }
    var col = getCollection(options.name)

    var cursor = invoke(col, options.method, options.args)

    cachedCursors[options.cursor] = cursor

    conn.cursors[options.cursor] = cursor

    return cursor
}

function getCollection(name) {
    if (cachedCollections[name]) {
        return cachedCollections[name]
    }
    //console.log("constructing collection with name", name)
    return (cachedCollections[name] = mongocol(name))    
}