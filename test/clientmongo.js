var Col = require("clientmongo")("__Col"),
    uuid = require("node-uuid"),
    assert = require("assert")

suite("clientmongo", function () {
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
        Col.insert(dummy, function (err) {
            isnull(err)
            var name = uuid()
            Col.rename(name, function (err, collection) {
                //console.log("rename", arguments)
                isnull(err)
                assert.equal(collection.collectionName, name)
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
})

function isnull(err) {
    assert.equal(err, null, "error is not null")
}