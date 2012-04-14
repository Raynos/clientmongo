var mongocol = require("mongo-col"),
    uuid = require("node-uuid"),
    dnode = require("dnode"),
    cached = {}

module.exports = function (httpServer) {
    if (typeof httpServer === "string") {
        return mongocol(httpServer)
    }
    dnode({
        sendCommand: function (options) {
            //console.log("sendCommand", options)
            var col = getCollection(options.name)

            invoke(col, options.method, options.args)
        },
        sendCollectionCommand: function (options) {
            var col = getCollection(options.name),
                args = options.args
                cb = args[args.length - 1]

            args[args.length - 1] = function (err, collection) {
                var name = uuid()
                cached[name] = collection
                cb(err, name)
            }

            invoke(col, options.method, options.args)
        },
        sendCursorCommand: function (options) {
            var col = getCollection(options.name)

            var cursor = invoke(col, options.method, options.args)
            options.commands.forEach(function (command) {
                cursor = invoke(cursor, command.method, command.args)
            })
        }
    }).listen(httpServer)
    return mongocol
}

function invoke(obj, name, args) {
    try {
        return obj[name].apply(obj, args)
    } catch (e) {
        console.log("args", name, args)
        var cb = args && args[args.length - 1]
        if (typeof cb === "function") {
            cb(err)
        }
    }
}

function getCollection(name) {
    if (cached[name]) {
        return cached[name]
    }
    console.log("constructing collection with name", name)
    return (cached[name] = mongocol(name))    
}