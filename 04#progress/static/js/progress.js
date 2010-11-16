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

$.fn.progressBar = function(id, progress) {
    var $template = $(this)
    var $bar = $("#job-" + id)
    $bar
        .otherwise(function() { 
            return $template.children().clone()
                .attr("id", "job-" + id)
                .find(".progress-text").text("JOB/" + id + " - 0%").end()
                .appendTo("#container")
        })
        .find(".progress-text").text("JOB/" + id + " - " + progress + "%").end()
        .find(".progress-bar").css("width", progress + "%").end()
    if (progress === 100) {
        $bar
            .find(".progress-bar").css("background-color", "red").end()
            .after(500, function() {
                $(this).fadeOut("slow", function() {
                    $(this).remove()
                })
            })
    }
}
