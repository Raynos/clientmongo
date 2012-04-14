var mongodb = require("mongodb"),
    // Grab the database HOST, PORT, USER and PASSWORD from the environment
    HOST = process.env["MONGODB_HOST"] || "localhost",
    PORT = +process.env["MONGODB_PORT"] || 27017,
    USER = process.env["MONGODB_USER"],
    PASSWORD = process.env["MONGODB_PASSWORD"],
    Db = mongodb.Db,
    Server = mongodb.Server,
    cachedResults,
    extend = require("pd").extend,
    callbackQueue

var Collection = {
    constructor: function (collection, callback) {
        collection((function (err, collection) { 
            this._collection = collection
            callback && callback(this)
        }).bind(this))
        this.collection = collection
        return this
    }
}

Object.keys(mongodb.Collection.prototype).forEach(addToCollection)

collection.mongo = mongo
collection.Collection = Collection

module.exports = collection

function mongo(collectionName, databaseName) {
    return getCollection

    function getCollection(callback) {
        openDatabase(databaseName || "DATABASE", openCollection)

        function openCollection(err, db) {
            if (err) {
                return callback(err)
            }
            getCollection.db = db
            db.collection(collectionName, callCallback)
        }

        function callCallback(err, collection) {
            callback.call(collection, err, collection)
        }
    }
}

function openDatabase(databaseName, callback) {
    if (cachedResults) {
        return callback.apply(cachedResults[1], cachedResults)
    } else if (callbackQueue) {
        return callbackQueue.push(callback)
    }

    callbackQueue = [callback]

    if (typeof databaseName === "object" && databaseName !== null) {
        db = databaseName
    } else {
        var db = new Db(databaseName, new Server(HOST, PORT, {
            auto_reconnect: true,
            poolSize: 4
        }), {})    
    }
    db.open(authenticateDatabase)

    function authenticateDatabase(err, db) {
        if (err) {
            return invokeCallbacks(err)
        }

        if (USER || PASSWORD) {
            db.authenticate(USER, PASSWORD, saveDatabase)    
        } else {
            invokeCallbacks(err, db)
        }
        
        function saveDatabase(err, success) {
            if (success) {
                return invokeCallbacks(err, db)
            }
            return invokeCallbacks(new Error("auth failed"))
        }
    }

    function invokeCallbacks(err, data) {
        var callbackList = callbackQueue
        cachedResults = arguments
        callbackQueue = null
        for (var i = 0, len = callbackList.length; i < len; i++) {
            callbackList[i].apply(arguments[1], arguments)
        }
    }
}

function collection (collectionName, databaseName, callback) {
    if (typeof databaseName === "function") {
        callback = databaseName
        databaseName = null
    }
    return extend({}, Collection).constructor(
        mongo(collectionName, databaseName), callback)
}

function addToCollection(methodName) {
    if (typeof mongodb.Collection.prototype[methodName] === "function" &&
        methodName !== "constructor"
    ) {
        Collection[methodName] = tunnel(methodName)    
    }
}

function tunnel(methodName) {
    return proxy

    function proxy() {
        var args = arguments,
            callback = args[args.length - 1]

        if (this._collection) {
            this[methodName] = makeCachedProxy(methodName)
            return this[methodName].apply(this, args)
        }

        this.collection(invokeMethod)

        function invokeMethod(err, collection) {
            if (err) {
                if (typeof callback === "function") {
                    callback(err)
                }
                console.log("Error: in mongo-col", err)
                return 
            }
            collection[methodName].apply(collection, args)
        }
    }
}

function makeCachedProxy(methodName) {
    return proxy

    function proxy() {
        var collection = this._collection
        return collection[methodName].apply(collection, 
            arguments)
    }
}