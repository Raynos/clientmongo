var connect = require("connect"),
    http = require("http"),
    browserify = require("browserify"),
    path = require("path"),
    indexPath = path.join(__dirname, "..", "..", "index.js"),
    clientmongo = require(indexPath)

var app = connect(),
    server = http.createServer(app),
    mongocol = clientmongo(server),
    madness = mongocol("Madness"),
    bundle = browserify()

bundle.require(indexPath)

bundle.addEntry(path.join(__dirname, "client.js"))

app.use(connect.static(__dirname))

app.use(bundle);

madness.drop(function () {
    madness.insert({ "this": "is sparta" }, function () {
        server.listen(3000)
        console.log('http://localhost:3000/')
    })
})