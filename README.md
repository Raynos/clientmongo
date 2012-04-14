# clientmongo

MongoDB on the client

## Example

    // client.js
    var clientmongo = require("clientMongo"),
        Users = clientmongo("Users")

    Users.insert({
        foo: "bar"
    }, function () {
        Users.findOne({ foo: "bar" }, function (err, person) {
            console.log(person.foo === "bar")
        })
    })

    // server.js

    var server = require("express").createServer(),
        clientmongo = require("clientmongo")(server)