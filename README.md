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

For a full example run the unit test suite (one code base) on both the server and the client.

To clarify, you can run the exact same code that interacts with mongoDB in both the browser and the server using `clientmongo`

## Tests

 1. Install dependencies `$ npm install`
 2. Run server-side tests `make test`
 3. Boot server for client-side tests `make test-server`
 4. Build client-side code for client-side tests `make test-build`
 5. Run tests in browser (localhost:3000) or `make test-run`