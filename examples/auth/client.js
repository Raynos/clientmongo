var clientmongo = require('./../index.js'),
    auth = clientmongo("Autho", "uniqueAuthToken"),
    fail = clientmongo("Failo", "brokenToken")

auth.findOne({ "success": true }, function (err, doc) {
    console.log(arguments)
    document.getElementById("public").textContent = doc.authWorks
})

auth.insert({ "cannot": "succeed" }, function (err) {
    console.log(arguments)
    document.getElementById("private").textContent = err.message
})

fail.findOne({ "success": false }, function (err) {
    console.log(arguments)
    document.getElementById("unauthorized").textContent = err.message
})