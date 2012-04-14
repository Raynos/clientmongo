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

            col[command].apply(col, args)
        }
    }).listen(httpServer)
    return mongocol
}

function getCollection(name) {
    if (cached[name]) {
        return cached[name]
    }
    console.log("constructing collection with name", name)
    return (cached[name] = mongocol(name))
}