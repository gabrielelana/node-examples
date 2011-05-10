var sys = require("sys"),
    path = require("path"),
    http = require("http"),
    _ = require("underscore"),
    io = require("socket.io"),
    connect = require("connect")


var Job = (function() {
  var EventEmitter = require("events").EventEmitter,
      spawn = require("child_process").spawn,
      inherits = require("util").inherits
  
  function Job(id) {
    EventEmitter.call(this)
    this.id = id
  }

  inherits(Job, EventEmitter)

  Job.prototype.run = function() {
    return _(this).tap(function(job) {
      spawn(path.join(__dirname, "bin", "job.sh"))
        .stdout.on("data", function(output) {
          job.emit("progress", job.id, parseInt(output.toString(), 10))
        })
    })
  }

  return Job
})()

var connections = {}, port = 8080, host = "0.0.0.0", counter = 0

var server = connect(
  connect.favicon(),
  connect.logger({ "buffer": true }),
  connect.router(function(resource) {
    resource.post("/spawn", function(request, response) {
      new Job(++counter)
        .on("progress", function(id, progress) {
          _(connections).each(function(connection) {
            connection.send({"id": id, "progress": progress})
          })
        })
        .run()

      response.writeHead(202, { "Content-Type": "plain/text" })
      response.end("OK\n")
    })
  }),
  connect.static(path.join(__dirname, "public"), { "cache": true })
)

io.listen(server, {"log": false}).on("connection", function(client) {
  connections[client.sessionId] = client
  client.on("disconnect", function() {
    delete connections[client.sessionId]
  })
})

server.listen(port, host, function() {
  console.log("listening...")
  var spawnJobsInterval = setInterval(function() {
    http.request({"port": port, "host": host, "method": "POST", "path": "/spawn"}).end()
  }, Math.floor(Math.random()*2000)+500)

  server.on("close", function() {
    console.log("bye...")
    clearInterval(spawnJobsInterval)
    process.exit()
  })
})

process.on("SIGINT", function() {
  server.close()
})

