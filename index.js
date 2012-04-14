if (typeof process !== "undefined" && process.title === "node") {
    module.exports = require("./lib/" + "server")
} else if (typeof window !== "undefined") {
    module.exports = require("./lib/client")
}