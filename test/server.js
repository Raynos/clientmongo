var connect = require("connect"),
    http = require("http"),
    dnode = require("dnode"),
    clientmongo = require("clientmongo")

var app = connect(),
    server = http.createServer(app)
    
dnode().use(clientmongo.middleware).listen(server)
app.use(connect.static(__dirname))

server.listen(3000)
console.log('Listening to port 3000')