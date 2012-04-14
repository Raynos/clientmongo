# mongo-col [![Build Status][1]][2]

mongoDB collection wrapper

## Status: production ready

## Example

### With mongo-db native

    var Db = require('mongodb').Db,
        Server = require('mongodb').Server
    
    var db = new Db('integration_tests', 
        new Server("127.0.0.1", 27017, {
           auto_reconnect: false, 
           poolSize: 4
        }))
    
    db.open(function(err, db) {
        db.collection("CollectionName", function(err, collection) {
            collection.insert({hello:'world_no_safe'}, function () {
                collection.findOne({hello:'world_no_safe'}, function(err, item) {
                    assert.equal(null, err)
                    assert.equal('world_no_safe', item.hello)
                    db.close()
                })
            })
        })
    })
    
### With mongo-col

    var collection = require("mongo-col"),
        CollectionName = collection("CollectionName", "integration_tests")
    
    CollectionName.insert({ hello: "world_no_safe"}, function () {
        CollectionName.findOne({ hello: "world_no_safe"}, function (err, item) {
            assert.equal(null, err)
            assert.equal('world_no_safe', item.hello)
            CollectionName.collection.db.close()
        })
    })

## Motivation

Setting up a mongodb database connection requires too much callback soup, remove it.

## Documentation

### <a name="collection" href="#collection">collection(collectionName[, databaseName])</a>

`collection` takes a collection name and returns a collection object. This collection object has all the mongodb collection methods and sets up a database connection internally

See the [MongoDB collection API][3]

    var collection = require("mongo-col"),
        Users = collection("Users", "optionalDatabaseName")

    Users.insert({
        name: "foo",
        password: "bar"
    })

You can optionally pass in a databaseName as a string or an instance of a mongodb database object.

There is also an optional async API

    require("mongo-col")("Users", function (collection) {
        ...  
    })

## <a name="benchmarks" href="#benchmarks">Benchmarks</a>

    $ make bench

    global native benchmark took  9332 53
    mongoose benchmark took  22710 121
    collection benchmark took  9851 56
    mongoskin benchmark took  10817 59


## Installation

`npm install mongo-col`

## Tests

`make test`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/mongo-col.png
  [2]: http://travis-ci.org/Raynos/mongo-col
  [3]: http://christkv.github.com/node-mongodb-native/api-generated/collection.html