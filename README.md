# clientmongo

MongoDB on the client

## <a href="#Example" name="Example">Example</a>

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

    var server = require("http").createServer(),
        dnode = require("dnode"),
        clientmongo = require("clientmongo")
    
    dnode().use(clientmongo.middleware).listen(server)

For a full example run the unit test suite (one code base) on both the server and the client.

To clarify, you can run the exact same code that interacts with mongoDB in both the browser and the server using `clientmongo`

## <a href="#Tests" name="Tests">Tests</a>

 1. Install dependencies `$ npm install`
 2. Run server-side tests `make test`
 3. Boot server for client-side tests `make test-server`
 4. Build client-side code for client-side tests `make test-build`
 5. Run tests in browser (localhost:3000) or `make test-run`

## <a href="#Documentation" name="Documentation">Documentation</a>

The APIs match the mongo-col API and more specifically the MongoDB [Collection][1] and [Cursor][2] API.

The only things missing are the options commands on the Collection.

### <a href="#Auth" name="Auth">Auth</a>

Auth can be implemented by passing auth tokens along in the browser

`var Users = clientmongo("Users", authToken)`

and by implementing auth handling in the server

    /*
        authToken comes from the browser authToken
        options is the options passed over RPC, including collectionName,
            method, args, cursor data
        callback is used for async auth
    */
    var clientmongo = require("clientmongo"),
        Users = clientmongo("Users")

    clientmongo.auth(function (authToken, options, callback) {
        // return boolean for allowed (sync)
        return true || false
        // or return allowed or not through callback
        setTimeout(function () {
            callback(true || false)
        }, 50)
    })

## MIT Licenced

  [1]: http://mongodb.github.com/node-mongodb-native/api-generated/collection.html
  [2]: http://mongodb.github.com/node-mongodb-native/api-generated/cursor.html