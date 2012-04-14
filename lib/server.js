var mongocol = require("mongo-col"),
    dnode = require("dnode"),
    cached = {}

module.exports = function (httpServer) {
    if (typeof httpServer === "string") {
        return mongocol(httpServer)
    }
    dnode({
        sendCommand: function (command, name, args) {
            var col = getCollection(name)

            invoke(col, command, args)
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
        var cb = args[args.length - 1]
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