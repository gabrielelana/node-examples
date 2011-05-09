var sys = require("sys"),
    path = require("path"),
    connect = require("connect"),
    spawn = require("child_process").spawn,
    Backbone = require("backbone"),
    Faye = require("faye"),
    _ = require("underscore")._


var boards = new Backbone.Collection
var users = new Backbone.Collection
    

var User = Backbone.Model.extend({ })
var Board = Backbone.Model.extend({
  "initialize": function() {
    this.set({
      "cells": {
        "cell-1": "_", 
        "cell-2": "_", 
        "cell-3": "_", 
        "cell-4": "_",
        "cell-5": "_",
        "cell-6": "_",
        "cell-7": "_",
        "cell-8": "_",
        "cell-9": "_"
      },
      "players": [],
      "status": "waiting-for-players"
    })
  },
  "user": function(userId) {
    var players = this.get("players")
    if (players.length === 0) {
      var player = new User({
        "id": userId,
        "role": "player",
        "board": this.get("id"),
        "mark": "X"
      })
      players.push(player.get("id"))
      this.set({
        "players": players
      })
      users.add(player)
      return player
    }
    if (players.length === 1) {
      var player = new User({
        "id": userId,
        "role": "player",
        "board": this.get("id"),
        "mark": "O"
      })
      players.push(player.get("id"))
      this.set({
        "players": players,
        "status": "playing",
        "turn": players[Math.ceil(Math.random()*2)-1]
      })
      users.add(player)
      return player
    }
    var spectactor = new User({
      "id": userId,
      "role": "spectactor",
      "board": this.get("id")
    })
    users.add(player)
    return spectactor
  },
  "move": function(move) {
    var cellId = move["cell"],
        cellMark = move["mark"],
        cells = _(this.get("cells")).clone(),
        turn = this.get("turn"),
        players = this.get("players")
    cells[cellId] = cellMark
    turn = players[(players.indexOf(turn) + 1) % players.length]
    this.set(
      _({ "cells": cells, "turn": turn }).extend(checkForWinner(cells))
    )
  }
})

var comet = new Faye.NodeAdapter({ "mount": "/comet", "timeout": 50 }),
    client = comet.getClient(),
    port = 8080


boards.bind("change", publishBoard)
boards.bind("add", publishBoard)


var server = connect.createServer(connect.logger({ "buffer": true }))
  .use("/comet", function(request, response, next) {
    comet.handle(request, response)
  })
  .use("/", connect.router(function(resource) {
    resource.get("/board", function(request, response, next) {
      request.url = "/board.html"
      next()
    })
    resource.post("/board", function(request, response) {
      response.writeHead(200, { "Content-Type": "application/json" })
      uuid(function(boardId) {
        response.end(
          JSON.stringify({
            "board": { "id": boardId }
          })
        )
      })
    })
    resource.get("/board/:id", function(request, response) {
      var board = boards.get(request.params["id"])
      if (board === undefined) {
        board = new Board({ "id": request.params["id"] })
        boards.add(board)
      }
      uuid(function(userId) {
        var user = board.user(userId)
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(
          JSON.stringify({
            "board": board,
            "user": user
          })
        )
      })
    })
    resource.post("/board/:id", function(request, response) {
      var body = ""
      request.on("data", function(chunk) {
        body += chunk
      })
      request.on("end", function() {
        boards.get(request.params["id"]).move(JSON.parse(body))
        response.writeHead(204, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ "response": "ok" }))
      })
    })
  }), connect.staticProvider({ 
    "root": path.join(__dirname, "static"), 
    "cache": true 
  }))


comet.attach(server)

server.listen(port)


function uuid(callback) {
  ;(function() {
      var chunks = "", generator = spawn("uuidgen")
      generator.stdout.on("data", function(chunk) {
        chunks += chunk
      })
      generator.on("exit", function() {
        callback(chunks.trim())
      })
  })()
}

function publishBoard(board) {
  client.publish("/board-" + board.get("id"), board)
}

function checkForWinner(cells) {
  var winnerIs = undefined,
      winPatterns = [
        [ 1, 2, 3 ],
        [ 4, 5, 6 ],
        [ 7, 8, 9 ],
        [ 1, 4, 7 ],
        [ 2, 5, 8 ],
        [ 3, 6, 9 ],
        [ 1, 5, 9 ],
        [ 3, 5, 7 ]
      ]
  _(winPatterns).each(function(pattern) {
    var values = _(pattern).map(function(index) {
      return cells["cell-" + index] 
    })
    if ((values[0] === values[1]) && (values[1] === values[2]) && (values[0] !== "_")) {
      winnerIs = values[0]
    }
  })
  if (winnerIs !== undefined) {
    return { "status": "over", "winner": winnerIs }
  }
  return {}
}
