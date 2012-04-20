var mongocol = require("mongo-col"),
    uuid = require("node-uuid"),
    pd = require("pd"),
    extend = pd.extend,
    memoize = pd.memoize
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
        getCollection(options, function (col) {
            invoke(col, options.method, options.args)    
        })
    }),
    sendCommandWithCollection: auth(function (options) {
        var collections = this.conn.collections

        getCollection(options, function (col) {
            var args = options.args,
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
                getCollection.cache[name] = [collection]
                collections[name] = collection
                cb(err, name)
            }

            invoke(col, options.method, options.args)
        })
    }),
    sendCommandWithCursor: auth(function (options) {
        var cursors = this.conn.cursors
        getCollection(options, function (col) {
            var args = options.args,
                cb = args[args.length - 1]

            args[args.length - 1] = function (err, cursor) {
                var name = uuid()
                cachedCursors[name] = cursor
                cursors[name] = cursor
                cb(err, name)
            }

            invoke(col, options.method, options.args)
        })  
    }),
    sendCursorCommand: auth(function (options) {
        //console.log("sendCursorCommand", options)
        getCursor(options, this.conn, function (err, cursor) {
            if (err) {
                console.log("Unhandled error in clientmongo::invoke", 
                    err, err.stack)    
            }
            //console.log("sendCursorCommand", options.name, options.commands)
            options.commands.forEach(function (command) {
                //console.log("invoking command", command.method, command.args)
                invoke(cursor, command.method, command.args)
            })
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

main.middleware = function (remote, conn) {
    extend(this, Methods).constructor(conn, main._auth)

    conn.on("end", function () {
        Object.keys(conn.cursors).forEach(function (cursorId) {
            delete getCursor.cache[cursorId]
        })
        Object.keys(conn.collections).forEach(function (collectionId) {
            delete getCollection.cache[collectionId]
        })
    })
}

main.auth = function (auth) {
    main._auth = auth
}

var getCollection = memoize(getCollection, function (options) {
        return options.name
    }),
    getCursor = memoize(getCursor, function (options) {
        return options.cursor
    })

module.exports = main

function main() {
    return mongocol.apply(this, arguments)
}

function invoke(obj, name, args) {
    try {
        return obj[name].apply(obj, args)
    } catch (err) {
        //console.log("args", err, name, args, obj)
        var cb = args && args[args.length - 1]
        if (typeof cb === "function") {
            cb(err)
        } else {
            console.log("Unhandled error in clientmongo::invoke", 
                err, err.stack)
        }
    }
}

function getCursor(options, conn, callback) {
    getCollection(options, function (collection) {
        var args = options.args,
            len = args.length,
            cb = args[len - 1]

        if (typeof cb === "function") {
            args[len - 1] = returnCursor
            invoke(collection, options.method, options.args)
        } else {
            returnCursor(null, 
                invoke(collection, options.method, options.args))
        }

        function returnCursor(err, cursor) {
            conn.cursors[options.cursor] = cursor
            callback(err, cursor)    
        }
    })
}

function getCollection(options, callback) {
    //console.log("constructing collection with name", name)
    var collection = mongocol(options.name, options.db, callback)
}