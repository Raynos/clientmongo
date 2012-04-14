var Db = require('mongodb').Db,
    Server = require('mongodb').Server,
    N = 200,
    Col = require("../")("Collection"),
    assert = require('assert'),
    mongoose = require('mongoose'),
    mongoskin = require("mongoskin"),
    Schema = mongoose.Schema,
    uuid = require("node-uuid"),
    User, 
    skinUser

var db_open_start = Date.now()
new Db('integration_tests', 
    new Server("127.0.0.1", 27017, {
       auto_reconnect: true, 
       poolSize: 4
    })
).open(function (err, global_db) {
    mongoose.connect('mongodb://localhost/my_database')

    var UserSchema = new Schema({
            hello: String
        }),
        skinDB = mongoskin.db('localhost:27017/testdb')

    User = mongoose.model('UserZ', UserSchema)
    skinUser = skinDB.collection('skinUser')

    var db_open_time = Date.now() - db_open_start
    runNTimes(N, globalDatabaseBench.bind(null, global_db), function (time, time2) {
        console.log("global native benchmark took ", time + db_open_time, time2)
        global_db.close()

        runNTimes(N, naiveMongooseBench, function (time, time2) {
            console.log("mongoose benchmark took ", time, time2)
            mongoose.disconnect()

            runNTimes(N, collectionBench, function (time, time2) {
                console.log("collection benchmark took ", time, time2)
                Col.collection.db.close()

                runNTimes(N, mongoSkinBench, function (time, time2) {
                    console.log("mongoskin benchmark took ", time, time2)
                    skinUser.drop(function () {
                        skinDB.close()    
                    })
                })
            })
        })
    })
})

function globalDatabaseBench(db, callback) {
    var native_start = Date.now()
    db.collection("CollectionN", function(err, col) {
        col.insert({hello:'world_no_safe'}, function () {
            col.findOne({hello:'world_no_safe'}, function(err, item) {
                var time_taken = Date.now()
                callback('world_no_safe' === (item && item.hello),
                    time_taken - native_start)
                //console.log("native", time_taken - native_start)
            })
        })
    })    
}


function naiveMongooseBench(callback) {
    var mongoose_start = Date.now()
    var token = uuid()
    User.create({ hello: token}, function () {
        User.findOne({ hello: token}, function (err, doc) {
            var time_taken = Date.now()
            callback(token === (doc && doc.hello), 
                time_taken - mongoose_start)
            //console.log("mongoose", time_taken - mongoose_start)
        })
    })
}

function collectionBench(callback) {
    var collection_start = Date.now()
    var token = uuid()
    Col.insert({ hello: token }, function () {
        Col.findOne({hello:token}, function(err, item) {
            var time_taken = Date.now()
            callback(token === (item && item.hello),
                    time_taken - collection_start)
            //console.log("collection", time_taken - collection_start)
        })
    })
}

function mongoSkinBench(callback) {
    var mongoskin_start = Date.now()
    var token = uuid()
    skinUser.insert({ hello: token }, function () {
        skinUser.findOne({hello:token}, function(err, item) {
            var time_taken = Date.now()
            callback(token === (item && item.hello),
                time_taken - mongoskin_start)
            //console.log("mongoskin", time_taken - mongoskin_start)
        })
    })    
}

function runNTimes(counter, program, cb) {
    var time = 0,
        total = counter,
        start_time = Date.now()
    for (var i = 0; i < total; i++) {
        program(function (success, cumulativeTime) {
            time += cumulativeTime
            if (success) {
                counter--
                if (counter === 0) {
                    var absoluteTime = Date.now() - start_time
                    return cb(time, absoluteTime)
                }
            }
        })
    }
}