var clientmongo = require("clientmongo"),
    Col = clientmongo("__Col"),
    uuid = require("node-uuid"),
    assert = require("assert")

suite("Collection", function () {
    var dummy = { foo: "bar" }

    setup(function (done) {
        Col.drop(function () { done() })
    })

    teardown(function (done) {
        Col.drop(function () { done() })
    })

    test("insert", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.findOne(dummy, function (err, doc) {
                isnull(err)
                assert.equal(doc.foo, "bar", 
                    "doc is wrong")
                done()
            })
        })
    })

    test("remove", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.remove(dummy, { safe: true }, function (err, count) {
                //console.log("remove", arguments)
                isnull(err)
                assert.equal(count, 1, 
                    "count of documents removed is wrong")
                Col.count(function (err, count) {
                    //console.log("count", arguments)
                    isnull(err)
                    assert.equal(count, 0,
                        "count of documents is wrong")
                    done()
                })
            })
        })
    })

    test("rename", function (done) {
        var Col = clientmongo(uuid())
        Col.insert(dummy, function (err) {
            isnull(err)
            var name = uuid()
            Col.rename(name, function (err, collection) {
                //console.log("rename", arguments)
                isnull(err)
                assert.equal(collection.collectionName, name,
                    "collectionName is wrong")
                done()
            })
        })
    })

    test("save", function (done) {
        var name = uuid()
        Col.save({ foo: name }, { safe: true }, function (err, result) {
            //console.log("save", arguments)
            isnull(err)
            assert.equal(result.foo, name, "result is incorrect")
            done()
        })
    })

    test("update", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.update(dummy, { 
                $set: {
                    baz: "boobab"
                }
            }, { safe: true}, function (err, result) {
                isnull(err)
                assert.equal(result, 1, "result is incorrect")
                Col.findOne(dummy, function (err, doc) {
                    isnull(err)
                    assert.equal(doc.baz, "boobab")
                    done()
                })
            })
        })
    })

    test("distinct", function (done) {
        Col.insert([{ a: 0 }, { a: 1 }, { a: 2}], function (err) {
            isnull(err)
            Col.distinct("a", function (err, docs) {
                isnull(err)
                docs.forEach(function (v, k) {
                    assert.equal(v, k, "docs not right")
                })
                done()
            })
        })
    })

    test("count", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.count(function (err, amount) {
                isnull(err)
                assert.equal(amount, 1, "count is wrong")
                done()
            })
        })
    })

    test("drop", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.drop(function (err, success) {
                isnull(err)
                assert.equal(true, success, "drop is not success")
                Col.count(function (err, count) {
                    isnull(err)
                    assert.equal(count, 0, "count is not zero")
                    done()
                })
            })
        })
    })

    test("findAndModify", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.findAndModify(dummy, [['_id', 1]], {
                $set: {
                    "foobar": "baz"
                }
            }, { 
                new: true
            }, function (err, doc) {
                isnull(err)
                assert.equal(doc.foobar, "baz", "foobar not set")
                done()
            })  
        })
    })

    test("findAndRemove", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.findAndRemove(dummy, [['_id', 1]], function (err, doc) {
                isnull(err)
                assert.equal(doc.foo, "bar", "doc incorrect")
                Col.count(function (err, count) {
                    isnull(err)
                    assert.equal(count, 0, "count incorrect")
                    done()
                })
            })
        })
    })

    test("find", function (done) {
        Col.insert(dummy, function (err) {
            Col.find().toArray(function (err, docs) {
                isnull(err)
                assert.equal(docs[0].foo, "bar", "docs is wrong")
                done()
            })
        })
    })

    test("findOne", function (done) {
        Col.insert(dummy, function (err) {
            isnull(err)
            Col.findOne(dummy, function (err, doc) {
                isnull(err)
                assert.equal(doc.foo, "bar", "doc incorrect")
                done()
            })
        })
    })

    test("createIndex", function (done) {
        Col.insert([{ a: 1 }, { a: 2 }, { a: 3 }], function (err) {
            isnull(err)
            Col.createIndex("a", { safe: true }, function (err, indexName) {
                isnull(err)
                assert.equal(indexName, "a_1", "indexName incorrect")
                Col.findOne({ a: 2 }, { explain: true }, 
                    function (err, result) 
                {
                    isnull(err)
                    var index = result.indexBounds.a[0]
                    assert.equal(index[0], 2, "index is incorrect")
                    assert.equal(index[1], 2, "index is incorrect")
                    done()
                })
            })
        })
    })

    test("ensureIndex", function (done) {
        Col.insert([
            {a:1, b:1}, 
            {a:1, b:1}, 
            {a:2, b:2}, 
            {a:3, b:3}, 
            {a:4, b:4}
        ], {safe:true}, function(err, result) {
            isnull(err)

            Col.ensureIndex({a:1, b:1}, {
                unique:true, 
                background:true, 
                dropDups:true, 
                safe:true
            }, function(err, indexName) {
                Col.find({}).toArray(function(err, items) {
                    isnull(err)
                    assert.equal(4, items.length)

                    Col.find(
                        {a:2}, 
                        {explain:true}
                    ).toArray(function(err, explanation) {
                        assert.equal(null, err)
                        assert.ok(explanation[0].indexBounds.a != null)
                        assert.ok(explanation[0].indexBounds.b != null)
                        done()
                    })
                })
            })
        })
    })

    test("indexInformation", function (done) {
        Col.insert([
            {a:1, b:1}, 
            {a:1, b:1}, 
            {a:2, b:2}, 
            {a:3, b:3}, 
            {a:4, b:4}
        ], {safe:true}, function(err, result) {
            isnull(err)

            Col.ensureIndex({a:1, b:1}, {
                unique:true, 
                background:true, 
                dropDups:true, 
                safe:true
            }, function(err, indexName) {
                Col.indexInformation(function(err, indexInformation) {
                    assert.equal('_id', indexInformation._id_[0][0])
                    assert.equal('a', indexInformation.a_1_b_1[0][0])
                    done()
                })
            })
        })
    })

    test("dropIndex", function (done) {
        Col.insert([
            {a:1, b:1}, 
            {a:1, b:1}, 
            {a:2, b:2}, 
            {a:3, b:3}, 
            {a:4, b:4}
        ], {safe:true}, function(err, result) {
            isnull(err)

            Col.ensureIndex({a:1, b:1}, {
                unique:true, 
                background:true, 
                dropDups:true, 
                safe:true
            }, function(err, indexName) {
                Col.dropIndex("a_1_b_1", function (err, result) {
                    isnull(err)
                    Col.indexInformation(function(err, indexInformation) {
                        assert.equal(undefined, indexInformation.a_1_b_1)
                        done()
                    })
                })
            })
        })
    })

    test("dropAllIndexes", function (done) {
        Col.insert([
            {a:1, b:1}, 
            {a:1, b:1}, 
            {a:2, b:2}, 
            {a:3, b:3}, 
            {a:4, b:4}
        ], {safe:true}, function(err, result) {
            isnull(err)

            Col.ensureIndex({a:1, b:1}, {
                unique:true, 
                background:true, 
                dropDups:true, 
                safe:true
            }, function(err, indexName) {
                Col.dropAllIndexes(function (err, result) {
                    isnull(err)
                    Col.indexInformation(function(err, indexInformation) {
                        assert.equal(undefined, indexInformation.a_1_b_1)
                        done()
                    })
                })
            })
        })
    })

    test("reIndex", function (done) {
        Col.insert([
            {a:1, b:1}, 
            {a:1, b:1}, 
            {a:2, b:2}, 
            {a:3, b:3}, 
            {a:4, b:4}
        ], {safe:true}, function(err, result) {
            isnull(err)

            Col.ensureIndex({a:1, b:1}, {
                unique:true, 
                background:true, 
                dropDups:true, 
                safe:true
            }, function(err, indexName) {
                Col.reIndex(function (err, result) {
                    isnull(err)
                    assert.equal(result, true, "index result is wrong")

                    Col.indexInformation(function(err, indexInformation) {
                        assert.equal('_id', indexInformation._id_[0][0])
                        assert.equal('a', indexInformation.a_1_b_1[0][0])
                        done()
                    })
                })
            })
        })
    })    

    test("mapReduce", function (done) {
        Col.insert([
            {'user_id':1}, 
            {'user_id':2}
        ], {safe:true}, function(err, r) {
            var map = "function() { emit(this.user_id, 1) }"
            var reduce = "function(k,vals) { return 1 }"

            Col.mapReduce(map, reduce, {
                out: {replace : 'tempCollection'}
            }, function(err, collection) {
                collection.findOne({'_id':1}, function(err, result) {
                    isnull(err)
                    assert.equal(1, result.value)

                    collection.findOne({'_id':2}, function(err, result) {
                        isnull(err)
                        assert.equal(1, result.value)
                        done()
                    })
                })
            })
        })
    })

    test("group", function (done) {
        Col.insert([{'a':2}, {'b':5}, {'a':1}], {
            safe:true
        }, function(err, ids) {
            isnull(err)
            Col.group(
                [], 
                {}, 
                {
                    "count": 0
                }, 
                "function (obj, prev) { prev.count++; }", 
                function(err, results) 
            {
                isnull(err)
                assert.equal(3, results[0].count);
                done()
            })
        })
    })

    test("indexExists", function (done) {
        Col.createIndex('a', {safe:true}, function(err, indexName) {
            isnull(err)
            Col.indexExists("a_1", function(err, result) {
                isnull(err)
                assert.equal(true, result)
                done()
            })
        })
    })

    test("geoNear", function (done) {
        Col.ensureIndex({loc:"2d"}, function(err, result) {
            isnull(err)
            Col.insert([
                {a:1, loc:[50, 30]}, 
                {a:1, loc:[30, 50]}
            ], {safe:true}, function(err, result) {
                Col.geoNear(50, 50, {
                    query:{a:1}, num:1
                }, function(err, docs) {
                    assert.equal(1, docs.results.length)
                    done()
                })
            })
        })
    })

    test("geoHaystackSearch", function (done) {
        Col.ensureIndex({
            loc: "geoHaystack", 
            type: 1
        }, {bucketSize: 1}, function(err, result) {
            Col.insert([
                {a:1, loc:[50, 30]}, 
                {a:1, loc:[30, 50]}
            ], {safe:true}, function(err, result) {
                Col.geoHaystackSearch(50, 50, {
                    search:{a:1}, 
                    limit:1, 
                    maxDistance:100
                }, function(err, docs) {
                    assert.equal(1, docs.results.length);
                    done()
                })
            })
        })
    })

    test("indexes", function (done) {
        Col.ensureIndex({a:1}, {safe:true}, function(err, result) {
            isnull(err)

            Col.indexes(function(err, indexes) {
                assert.equal(2, indexes.length)
                done()
            })
        })
    })

    test("stats", function (done) {
        Col.insert([
            {a:1}, {hello:'world'}
        ], {safe:true}, function(err, result) {
            Col.stats(function(err, stats) {
                assert.equal(2, stats.count);
                done()
            })
        })
    })
})

suite("Cursor", function () {
    var cursor,
        dummy = [{
            a: 1
        }, {
            a: 2
        }, {
            a: 3
        }]

    setup(function (done) {
        Col.drop(function () {
            Col.insert(dummy, function () {
                cursor = Col.find()
                done()
            })
        })
    })

    teardown(function (done) {
        Col.drop(function () { done() })
    })

    test("rewind", function (done) {
        cursor.nextObject(function (err, item) {
            assert.equal(item.a, 1)

            cursor.rewind()

            cursor.nextObject(function (err, item) {
                assert.equal(item.a, 1)
                done()
            })
        })
    })
})

function isnull(err) {
    assert.equal(err, null, "error is not null")
}