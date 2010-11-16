var port = 8080,
    spawn = require("child_process").spawn

var server = require("http").createServer()

server.on("request", function(request, response) {
    var longRunningProcess = spawn("./long_running_job.sh")

    response.writeHead(200, { "Content-Type": "plain/text" })

    longRunningProcess.stdout.on("data", function(tick) {
        response.write(tick)  
    })

    longRunningProcess.on("exit", function() {
        response.end()
    })

})

server.listen(port)
