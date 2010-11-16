var sys = require("sys"),
    path = require("path"),
    connect = require("connect"),
    spawn = require("child_process").spawn,
    Faye = require("faye")

var comet = new Faye.NodeAdapter({ "mount": "/comet", "timeout": 50 }),
    client = comet.getClient(),
    jobsCounter = 1,
    port = 8080

var server = connect.createServer(connect.logger({ "buffer": true }))
    .use("/comet", function(request, response, next) {
        comet.handle(request, response)
    })
    .use("/spawn", function(request, response, next) {
        var worker = spawn("./long_running_job.sh"),
            jobId = jobsCounter++
        
        response.writeHead(200, { "Content-Type": "plain/text" })
        response.end("OK\n")

        worker.stdout.on("data", function(progress) {
            client.publish("/job-progress", { 
                "id": jobId, 
                "progress": parseInt(progress.toString(), 10)
            })
        })
    })
    .use("/", connect.staticProvider({ 
        "root": path.join(__dirname, "static"), 
        "cache": true 
    }))

comet.attach(server)

server.listen(port)




doRequestAtRandom(require('http').createClient(port, "127.0.0.1"))

function doRequestAtRandom(client) {
    setTimeout(function() {
        client.request("GET", "/spawn").end()
        doRequestAtRandom(client)
    }, Math.floor(Math.random() * 2000))
}
