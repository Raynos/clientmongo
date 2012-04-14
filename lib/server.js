var mongocol = require("mongo-col"),
    dnode = require("dnode"),
    cached = {},
    server = dnode({
        sendCommand: function (command, name, args) {
            var col = getCollection(name)

            col[command].apply(col, args)
        }
    })

module.exports = function (httpServer) {
    if (typeof httpServer === "string") {
        return mongocol(httpServer)
    }
    server.listen(httpServer)
    return mongocol
}

function getCollection(name) {
    if (cached[name]) {
        return cached[name]
    }
    return (cached[name] = mongocol(name))
}