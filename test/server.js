var connect = require("connect"),
    http = require("http"),
    clientmongo = require("clientmongo")

var app = connect(),
    server = http.createServer(app),
    mongocol = clientmongo(server)

app.use(connect.static(__dirname))

server.listen(3000)
console.log('listening to port 3000')