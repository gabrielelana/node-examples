var sys = require("sys"),
    path = require("path"),
    http = require("http"),
    _ = require("underscore"),
    io = require("socket.io"),
    connect = require("connect"),
    spawn = require("child_process").spawn

var connections = {}, port = 8080, host = "0.0.0.0", counter = 0

var server = connect(
  connect.favicon(),
  connect.logger({ "buffer": true }),
  connect.router(function(resource) {
    resource.post("/spawn", function(request, response) {
      var job = spawn(path.join(__dirname, "bin", "job.sh")), id = ++counter
      
      response.writeHead(202, { "Content-Type": "plain/text" })
      response.end("OK\n")

      job.stdout.on("data", function(output) {
        var progress = parseInt(output.toString(), 10)
        _(connections).each(function(connection) {
          connection.send({"id": id, "progress": progress})
        })
      })
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
