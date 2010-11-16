var port = 8080,
    fs = require("fs"),
    http = require("http"),
    server = http.createServer()

function forEachLine(chunks, callback) {
    var buffer = chunks.join("")
    buffer.substr(0, buffer.lastIndexOf("\n")).split("\n").forEach(callback)
    return buffer.substr(buffer.lastIndexOf("\n") + 1).split("\n")
}

server.on("request", function(request, response) {
    var chunks = [],
        output = fs.createWriteStream("./output")

    request.on("data", function(chunk) {
        chunks = forEachLine(chunks.concat(chunk), function(line) {
            output.write(parseInt(line, 10) * 2)
            output.write("\n")
        })
    })

    request.on("end", function() {
        response.writeHead(200, { "Content-Type": "plain/text" })
        response.end("OK\n")
        output.end()
        server.close()
    })

})

server.listen(port)
