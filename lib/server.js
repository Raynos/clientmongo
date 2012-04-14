var mongocol = require("mongo-col"),
    dnode = require("dnode"),
    server = dnode({

    })

module.exports = function (httpServer) {
    server.listen(httpServer)
    return mongocol
}