var connect = require("connect"),
    http = require("http"),
    browserify = require("browserify"),
    path = require("path"),
    indexPath = path.join(__dirname, "..", "..", "index.js"),
    clientmongo = require(indexPath)

var app = connect(),
    server = http.createServer(app),
    mongocol = clientmongo(server, function (auth, options) {
        console.log("auth called", options)
        if (auth !== "uniqueAuthToken") {
            return false
        }
        if (options.method === "findOne") {
            return true
        }
        return false
    }),
    auth = mongocol("Autho"),
    bundle = browserify()

bundle.require(indexPath)

bundle.addEntry(path.join(__dirname, "client.js"))

app.use(connect.static(__dirname))

app.use(bundle);

auth.drop(function () {
    auth.insert({ 
        "success": true,
        "authWorks": "auth works"
    }, function () {
        server.listen(3000)
        console.log('http://localhost:3000/')
    })
})