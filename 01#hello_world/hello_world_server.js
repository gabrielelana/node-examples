var http = require("http")

var server = http.createServer(function(request, response) {
	response.writeHead(200, {
		"Content-Type": "plain/text"
	})
	response.write("Hello World\n")
	response.end()
})

server.listen(8080)

console.log("> SERVER STARTED")
