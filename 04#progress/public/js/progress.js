$.fn.progressBar = function(id, progress) {
  var $template = $(this)
  $("#job-" + id)
    .otherwise(function() { 
      return $template.children().clone()
        .attr("id", "job-" + id)
        .find(".progress-text").text("JOB/" + id + " - 0%").end()
        .appendTo("#container")
    })
    .find(".progress-text").text("JOB/" + id + " - " + progress + "%").end()
    .find(".progress-bar").css("width", progress + "%").end()
    .tap(function() {
      if (progress === 100) {
        $(this)
          .find(".progress-bar").css("background-color", "red").end()
          .after(500, function() {
            $(this).fadeOut("slow", function() {
              $(this).remove()
            })
          })
      }
    })
}

$.fn.otherwise = function(ifNotFound) {
  if (this.length === 0) {
    return ifNotFound()
  }
  return this
}

$.fn.after = function(milliseconds, doSomething) {
  var self = this
  setTimeout(function() {
    doSomething.apply(self)
  }, milliseconds)
  return this
}

$.fn.tap = function() {
  var fn = Array.prototype.shift.apply(arguments)
  fn.apply(this, arguments)
  return this
}
