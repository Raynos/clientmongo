var clientmongo = require('./../index.js'),
    madness = clientmongo("Madness")

madness.findOne({ "this": "is sparta" }, function (err, doc) {
    document.getElementById("says").textContent = doc.this
})