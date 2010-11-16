var server = require("http").createServer()

server.on("request", function(request, response) {
	console.log("> REQUEST STARTED")
	request.on("end", function() {
		console.log("> REQUEST CLOSED")
		response.writeHead(200, {
			"Content-Type": "plain/text"
		})
		response.end("Hello World\n")
		server.close()
	})
	response.on("close", function() {
		console.log("> RESPONSE CLOSED")
	})
})

server.on("close", function() {
	console.log("> SERVER CLOSED")
})

server.on("listening", function() {
	console.log("> SERVER STARTED")
})

server.listen(8080)

// var server = http.createServer(function(request, response) {
// 	request.on("end", function() {
// 		console.log("Request ended")
// 		response.writeHead(200, {
// 			"Content-Type": "plain/text"
// 		})
// 		response.write("Hello World\n")
// 		response.end()
// 	})
// })
// 
// server.listen(8080)

// console.log("Server Started")
