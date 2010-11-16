Raphael.el.after = function(milliseconds, callback) {
  var context = this
  setTimeout(function() { callback.apply(context) }, milliseconds)
}

Raphael.el.redraw = function(callback) {
  var paper = this.paper, overboard = 99
  paper.rect(-overboard, -overboard, paper.width + overboard, paper.height + overboard)
    .attr({ "stroke": "none" })
    .after(100, function() {
      this.remove()
      if (callback) callback.apply(this)
    })
}

$(function() {

  window.User = Backbone.Model.extend({
    "isPlayer": function() {
      return this.get("role") === "player"
    }
  })

  window.Cells = Backbone.Model.extend({ })

  window.Board = Backbone.Model.extend({
    "initialize": function() {
      var self = this, cells = new Cells(this.get("cells"))
      _(_.range(1,10)).each(function(counter) {
        cells.bind("change:cell-" + counter, function(cells, mark) {
          self.trigger("move", "cell-" + counter, mark)
        })
      })
      this.set({ "cells": cells })
    },
    "cells": function() {
      return _(this.get("cells").attributes).values()
    },
    "isMyTurn": function(player) {
      return (this.get("status") === "playing") &&
        (this.get("turn") === player.get("id"))
    },
    "isPlaying": function() {
      return this.get("status") === "playing"
    },
    "isOver": function() {
      return this.get("status") === "over"
    }
  })

  window.Game = Backbone.Model.extend({
    "initialize": function() {
      this.bind("change:board", function(game, board) {
        var me = game.get("me")
        if (game.previous("board") === undefined) {
          game.trigger("play-with-board", board.cells())
          if (me.isPlayer()) {
            game.trigger("play-with-mark", me.get("mark"))
          }
          if (board.isMyTurn(me)) {
            game.trigger("make-your-move")
          }
        }
        board.bind("change", function() {
          if (this.isPlaying()) {
            if (this.isMyTurn(me)) {
              return game.trigger("make-your-move")
            }
            return game.trigger("wait-for-move")
          }
          if (this.isOver()) {
            return game.trigger("over")  
          }
        })
        board.bind("move", function(cellId, cellMark) {
          game.trigger("move", cellId, cellMark)
        })
      })
    },
    "start": function() {
      start(this)
    }
  })

  function start(game) {
    var paper = Raphael("board", 800, 600), 
        boardWidth = 800,
        boardHeight = 600,
        cellWidth = 130, 
        cellHeight = 150,
        cellCounter = 1,
        myMark = undefined,
        cellMarksUrl = {
          "X": "/img/blackboard-X.png",
          "O": "/img/blackboard-O.png"
        }

    game.bind("play-with-board", function(cells) {
      buildBoard(['_'].concat(cells))
    })

    game.bind("play-with-mark", function(mark) {
      showPlayerMarker(cellMarksUrl[myMark = mark])
    })

    game.bind("make-your-move", function() {
      $("#board").undelegate()
      $("#board").delegate("*[id^=cell]", "mouseover", function() {
        $(this).data("cell").select()
      })
      $("#board").delegate("*[id^=cell]", "mouseout", function() {
        $(this).data("cell").unselect()
      })
      $("#board").delegate("*[id^=cell]", "click", function() {
        if (!$(this).data("cell").isMarked()) {
          var boardId = game.get("board").get("id"),
              cellId = $(this).attr("id"),
              cellMark = myMark
          $.ajax({ 
            "url": "/board/" + boardId, 
            "type": "POST", 
            "data": JSON.stringify({ "cell": cellId, "mark": cellMark }),
            "dataType": "json",
            "contentType": "application/json;charset=utf-8",
            "success": function(result) {
              // do nothing
            }
          })
        }
      })
    })

    game.bind("wait-for-move", function() {
      $("#board").undelegate()
    })

    game.bind("move", function(cellId, cellMark) {
      $("#" + cellId).data("cell").markWith(cellMarksUrl[cellMark])
    })

    game.bind("over", function() {
      $("#board").undelegate()
      if (game.get("board").get("winner") === myMark) {
        $("#message").text("You Win!")
      } else {
        $("#message").text("You Lose...")
      }
    })

    function buildBoard(cells) {
      paper.image("/img/blackboard-base.png", 0, 0, boardWidth, boardHeight)
      _([ 44, 224, 404 ]).each(function(startAtY) {
        _([ 176, 336, 496 ]).each(function(startAtX) {
          var cellId = cellCounter++,
              cell = _(
            paper.rect(startAtX, startAtY, cellWidth, cellHeight).attr({
              "fill": "#000",
              "fill-opacity": 0,
              "stroke": "#FFF",
              "stroke-opacity": 0,
              "stroke-width": 2
            })
          ).extend({
            "select": function() {
              this.attr(
                this.isMarked() ?
                { "stroke": "#F00", "stroke-opacity": 100 } :
                { "stroke": "#FFF", "stroke-opacity": 100 }
              )
            },
            "unselect": function() {
              this.attr({ "stroke-opacity": 0 })
            },
            "markWith": function(markUrl) {
              if (!this.isMarked()) {
                this.unselect()
                this.attr({
                  "fill": "url(" + markUrl + ")",
                  "fill-opacity": 100
                }).redraw()
                $(this.node).data("marked", true)
              }
            },
            "isMarked": function() {
              return $(this.node).data("marked")
            }
          })
          $(cell.node)
            .attr("id", "cell-" + cellId)
            .data("cell", cell)
          if (_([ "X", "O" ]).contains(cells[cellId])) {
            cell.markWith(cellMarksUrl[cells[cellId]])
          }
        })
      })
    }

    function showPlayerMarker(playerMarkerUrl) {
      paper.image(playerMarkerUrl, 0, 0, cellWidth, cellHeight).redraw()
    }

  }

})

