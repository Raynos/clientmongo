var collection = require("../"),
    assert = require("assert"),
    Users = collection("Users")

describe("mongo-collection", function () {
    beforeEach(function (done) {
        Users.drop(function () {
            Users.insert({ name: "foo" }, function () {
                done()
            })
        })
    })

    it("should allow inserting", function (done) {
        assert(Users.collection.db, "database exists")
        Users.findOne({ name: "foo" }, function (err, data) {
            assert(data.name === "foo",
                "data name incorrect")
            done()
        })    
    })

    it("should support cursors", function (done) {
        Users.find({}, function (err, cursor) { 
            cursor.toArray(function (err, data) { 
                assert(data[0].name === "foo",
                    "data name incorrect")
                done()
            }) 
        })
    })
})