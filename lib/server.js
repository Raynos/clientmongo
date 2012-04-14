var mongocol = require("mongo-col"),
    uuid = require("node-uuid"),
    dnode = require("dnode"),
    extend = require("pd").extend,
    cachedCollections = {},
    cachedCursors = {}

var Methods = {
    constructor: function (conn) {
        this.conn = conn
        conn.cursors = {}
        conn.collections = {}
        return this
    },
    sendCollectionCommand: function (options) {
        //console.log("sendCommand", options)
        var col = getCollection(options.name)

        invoke(col, options.method, options.args)
    },
    sendCommandWithCollection: function (options) {
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
    },
    sendCommandWithCursor: function (options) {
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
    },
    sendCursorCommand: function (options) {
        var cursor = getCursor(options, this.conn)
        //console.log("sendCursorCommand", options.name, options.commands)
        options.commands.forEach(function (command) {
            //console.log("invoking command", command.method, command.args)
            invoke(cursor, command.method, command.args)
        })
    }
}

module.exports = function (httpServer) {
    if (typeof httpServer === "string") {
        return mongocol(httpServer)
    }
    dnode(function (remote, conn) {
        extend(this, Methods).constructor(conn)

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
        console.log("args", err, name, args)
        var cb = args && args[args.length - 1]
        if (typeof cb === "function") {
            cb(err)
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