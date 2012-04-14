var Col = require("clientmongo")("__Col"),
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

    test("remote", function (done) {
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
})

function isnull(err) {
    assert.equal(err, null, "error is not null")
}